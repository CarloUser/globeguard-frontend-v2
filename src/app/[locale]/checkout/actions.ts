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
import {revalidatePath, updateTag} from 'next/cache';
import {redirect} from '@/i18n/navigation';
import {getLocale} from 'next-intl/server';

/**
 * Payment method codes starting with this prefix are handled by the Mollie
 * plugin (Phase 2e). Until then they are rejected at placeOrder time.
 */
const MOLLIE_PAYMENT_METHOD_CODE_PREFIX = 'mollie';

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
 * Transition the active order to ArrangingPayment. Idempotent: if the order is
 * already in that state (e.g. after a failed or abandoned payment attempt) this is a no-op.
 */
export async function transitionToArrangingPayment() {
    const current = await query(GetActiveOrderStateQuery, {}, {useAuthToken: true});
    const activeOrder = current.data.activeOrder;

    if (!activeOrder) {
        throw new Error('No active order');
    }

    if (activeOrder.state === 'ArrangingPayment') {
        return;
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
}

export type PlaceOrderResult = { success: false; error: string };

/**
 * Places the order with the selected payment method.
 *
 * - Offline payment methods (e.g. invoice / bank transfer handlers configured in the
 *   backend) are added directly via addPaymentToOrder with empty metadata.
 * - Mollie (online) payment is NOT wired yet. See the TODO below.
 *
 * On success this redirects to the order confirmation page; on failure it returns
 * an error object so the caller can surface it.
 */
export async function placeOrder(paymentMethodCode: string): Promise<PlaceOrderResult | undefined> {
    if (paymentMethodCode.toLowerCase().startsWith(MOLLIE_PAYMENT_METHOD_CODE_PREFIX)) {
        // TODO(Phase 2e, Mollie): create the Mollie payment intent via the
        // `createMolliePaymentIntent` mutation, redirect the customer to the
        // returned Mollie checkout URL and let the backend webhook settle the
        // payment. Do NOT call addPaymentToOrder for Mollie methods.
        return {success: false, error: 'PAYMENT_METHOD_NOT_AVAILABLE'};
    }

    try {
        await transitionToArrangingPayment();
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'ORDER_STATE_TRANSITION_ERROR',
        };
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
        return {success: false, error: `${errorResult.errorCode} - ${errorResult.message}`};
    }

    const orderCode = result.data.addPaymentToOrder.code;

    // Update the cart tag to immediately invalidate cached cart data
    updateTag('cart');
    updateTag('active-order');

    const locale = await getLocale();
    redirect({href: `/order-confirmation/${orderCode}`, locale});
    // redirect() throws; this is only here to satisfy the return type.
    return undefined;
}
