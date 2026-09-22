'use server';

import {graphql} from '@/graphql';
import {mutate, query} from '@/lib/vendure/api';
import {
    SetOrderShippingAddressMutation,
    SetOrderBillingAddressMutation,
    SetOrderShippingMethodMutation,
    AddPaymentToOrderMutation,
    CreateCustomerAddressMutation,
    TransitionOrderToStateMutation,
} from '@/lib/vendure/mutations';
import {createMolliePaymentIntent, toMollieLocale} from '@/lib/vendure/mollie';
import {isMolliePaymentMethod, MOLLIE_PAYMENT_METHOD_CODE} from '@/components/checkout/payment-method-codes';
import {getSiteUrl} from '@/lib/metadata';
import {revalidatePath, updateTag} from 'next/cache';
import {getPathname, redirect} from '@/i18n/navigation';
import {getLocale} from 'next-intl/server';

const GetActiveOrderStateQuery = graphql(`
    query GetActiveOrderState {
        activeOrder {
            id
            code
            state
        }
    }
`);

interface AddressInput {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    countryCode: string;
    phoneNumber: string;
    company?: string;
}

/**
 * Vendure only accepts address and shipping-method changes while the order is in
 * AddingItems. The checkout page also admits orders in ArrangingPayment (after a
 * declined or abandoned payment attempt), so such orders are moved back first;
 * ArrangingPayment -> AddingItems is a permitted transition.
 */
async function ensureOrderIsAddingItems() {
    const current = await query(GetActiveOrderStateQuery, {}, {useAuthToken: true});
    const activeOrder = current.data.activeOrder;

    if (!activeOrder) {
        throw new Error('No active order');
    }

    if (activeOrder.state !== 'ArrangingPayment') {
        return;
    }

    const result = await mutate(
        TransitionOrderToStateMutation,
        {state: 'AddingItems'},
        {useAuthToken: true}
    );

    if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
        const errorResult = result.data.transitionOrderToState;
        throw new Error(
            `Failed to reopen order for editing: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }
}

export async function setShippingAddress(
    shippingAddress: AddressInput,
    useSameForBilling: boolean
) {
    await ensureOrderIsAddingItems();

    const shippingResult = await mutate(
        SetOrderShippingAddressMutation,
        {input: shippingAddress},
        {useAuthToken: true}
    );

    if (shippingResult.data.setOrderShippingAddress.__typename !== 'Order') {
        throw new Error('Failed to set shipping address');
    }

    if (useSameForBilling) {
        await mutate(
            SetOrderBillingAddressMutation,
            {input: shippingAddress},
            {useAuthToken: true}
        );
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
}

export async function setShippingMethod(shippingMethodId: string) {
    await ensureOrderIsAddingItems();

    const result = await mutate(
        SetOrderShippingMethodMutation,
        {shippingMethodId: [shippingMethodId]},
        {useAuthToken: true}
    );

    if (result.data.setOrderShippingMethod.__typename !== 'Order') {
        throw new Error('Failed to set shipping method');
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
}

export async function createCustomerAddress(address: AddressInput) {
    const result = await mutate(
        CreateCustomerAddressMutation,
        {input: address},
        {useAuthToken: true}
    );

    if (!result.data.createCustomerAddress) {
        throw new Error('Failed to create customer address');
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
    return result.data.createCustomerAddress;
}

/**
 * Transition the active order to ArrangingPayment and return its code. Idempotent: if the
 * order is already in that state (e.g. after a failed or abandoned payment attempt) this
 * is a no-op.
 */
export async function transitionToArrangingPayment(): Promise<string> {
    const current = await query(GetActiveOrderStateQuery, {}, {useAuthToken: true});
    const activeOrder = current.data.activeOrder;

    if (!activeOrder) {
        throw new Error('No active order');
    }

    if (activeOrder.state === 'ArrangingPayment') {
        return activeOrder.code;
    }

    const result = await mutate(
        TransitionOrderToStateMutation,
        {state: 'ArrangingPayment'},
        {useAuthToken: true}
    );

    if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
        const errorResult = result.data.transitionOrderToState;
        throw new Error(
            `Failed to transition order state: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
    return activeOrder.code;
}

export type PlaceOrderResult =
    /** Online payment: the browser must navigate to the Mollie hosted checkout. */
    | {success: true; redirectUrl: string}
    | {
          success: false;
          /** Which step failed; the review step maps `errorCode` to a translated message. */
          source: 'transition' | 'mollie' | 'offline';
          error: string;
          errorCode?: string;
      };

/**
 * Places the order with the selected payment method.
 *
 * - 'mollie' (decision A5/O5, the single "Online bezahlen" tile): the order is moved to
 *   ArrangingPayment (idempotent) and a Mollie payment intent is created with an absolute
 *   redirectUrl pointing at /order-confirmation/<code>. The Mollie checkout URL is returned
 *   so the client can do a full `window.location.assign`; the webhook settles the payment.
 *   addPaymentToOrder is NEVER called for Mollie.
 * - Offline methods ('invoice' for approved company customers) are added directly via
 *   addPaymentToOrder with empty metadata and redirect to the confirmation page server-side.
 *
 * On failure an error object is returned so the caller can surface it.
 */
export async function placeOrder(paymentMethodCode: string): Promise<PlaceOrderResult | undefined> {
    let orderCode: string;
    try {
        orderCode = await transitionToArrangingPayment();
    } catch (error) {
        return {
            success: false,
            source: 'transition',
            errorCode: 'ORDER_STATE_TRANSITION_ERROR',
            error: error instanceof Error ? error.message : 'ORDER_STATE_TRANSITION_ERROR',
        };
    }

    if (isMolliePaymentMethod(paymentMethodCode)) {
        return startMolliePayment(orderCode);
    }

    const result = await mutate(
        AddPaymentToOrderMutation,
        {
            input: {
                method: paymentMethodCode,
                metadata: {},
            },
        },
        {useAuthToken: true}
    );

    if (result.data.addPaymentToOrder.__typename !== 'Order') {
        const errorResult = result.data.addPaymentToOrder;
        return {
            success: false,
            source: 'offline',
            errorCode: errorResult.errorCode,
            error: `${errorResult.errorCode} - ${errorResult.message}`,
        };
    }

    const placedOrderCode = result.data.addPaymentToOrder.code;

    // Update the cart tag to immediately invalidate cached cart data
    updateTag('cart');
    updateTag('active-order');

    const locale = await getLocale();
    redirect({href: `/order-confirmation/${placedOrderCode}`, locale});
    // redirect() throws; this is only here to satisfy the return type.
    return undefined;
}

/**
 * Create the Mollie payment intent for the order that is now in ArrangingPayment.
 *
 * The 3.5.5 plugin uses an explicit `redirectUrl` verbatim (the order code is only appended
 * to the handler's fallback URL), so the absolute confirmation URL including the code is
 * built here from NEXT_PUBLIC_SITE_URL and the locale-aware pathname.
 */
async function startMolliePayment(orderCode: string): Promise<PlaceOrderResult> {
    const locale = await getLocale();
    const redirectUrl = `${getSiteUrl()}${getPathname({locale, href: `/order-confirmation/${orderCode}`})}`;

    const outcome = await createMolliePaymentIntent({
        paymentMethodCode: MOLLIE_PAYMENT_METHOD_CODE,
        redirectUrl,
        locale: toMollieLocale(locale),
    });

    if (!outcome.ok) {
        return {success: false, source: 'mollie', errorCode: outcome.errorCode, error: outcome.message};
    }

    return {success: true, redirectUrl: outcome.url};
}
