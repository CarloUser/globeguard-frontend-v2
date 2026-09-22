/**
 * Mollie (online payment) documents and server-side helpers for the checkout.
 *
 * Contract of @vendure/payments-plugin 3.5.5, verified in the backend's
 * node_modules/@vendure/payments-plugin/package/mollie/mollie.service.js:
 * - `createMolliePaymentIntent` needs the 'mollie' method to be eligible, the order to be in
 *   (or transitionable to) ArrangingPayment, a customer with first and last name and a
 *   complete billing or shipping address. It returns the Mollie hosted-checkout `url`.
 * - When `redirectUrl` is passed it is used VERBATIM; the order code is appended only to the
 *   handler's fallback redirectUrl. The storefront therefore builds the absolute
 *   `/order-confirmation/<code>` URL itself (see checkout/actions.ts).
 * - Settlement happens through the webhook `/payments/mollie/<channelToken>/<methodId>`:
 *   with `immediateCapture: true` (backend option) a paid payment moves the order to
 *   PaymentSettled. Cancelled / failed / expired Mollie statuses are ignored by the webhook,
 *   so an abandoned payment leaves the order in ArrangingPayment.
 * - There is NO `syncMolliePaymentStatus` mutation in 3.5.5; the confirmation page can only
 *   poll `orderByCode`.
 *
 * Server-only: goes through `mutate` / `query` with the auth cookie. Client components use
 * src/components/checkout/payment-method-codes.ts instead.
 */
import {graphql, type ResultOf, type VariablesOf} from '@/graphql';
import {
    MOLLIE_PAYMENT_METHOD_CODE,
    type MolliePaymentMethodSummary,
} from '@/components/checkout/payment-method-codes';
import {mutate, query} from '@/lib/vendure/api';

export const CreateMolliePaymentIntentMutation = graphql(`
    mutation CreateMolliePaymentIntent($input: MolliePaymentIntentInput!) {
        createMolliePaymentIntent(input: $input) {
            __typename
            ... on MolliePaymentIntent {
                url
            }
            ... on MolliePaymentIntentError {
                errorCode
                message
            }
        }
    }
`);

export const GetMolliePaymentMethodsQuery = graphql(`
    query GetMolliePaymentMethods($input: MolliePaymentMethodsInput!) {
        molliePaymentMethods(input: $input) {
            id
            code
            description
            status
            minimumAmount {
                value
                currency
            }
            maximumAmount {
                value
                currency
            }
            image {
                size1x
                size2x
                svg
            }
        }
    }
`);

export type MolliePaymentIntentInput = VariablesOf<typeof CreateMolliePaymentIntentMutation>['input'];
export type MolliePaymentMethod = ResultOf<typeof GetMolliePaymentMethodsQuery>['molliePaymentMethods'][number];

export type MolliePaymentIntentOutcome =
    | {ok: true; url: string}
    | {ok: false; errorCode: string; message: string};

/**
 * Locale of Mollie's hosted checkout per storefront locale (Mollie's supported list:
 * https://docs.mollie.com/reference/common-data-types#locale). Unknown locales are left
 * to Mollie's browser-language detection.
 */
const MOLLIE_LOCALES: Record<string, string> = {
    de: 'de_CH',
    en: 'en_US',
};

export function toMollieLocale(locale: string): string | undefined {
    return MOLLIE_LOCALES[locale];
}

/**
 * Create the Mollie payment intent for the active order and return the hosted-checkout URL
 * the browser must be sent to (full navigation, not the next-intl router).
 */
export async function createMolliePaymentIntent(input: MolliePaymentIntentInput): Promise<MolliePaymentIntentOutcome> {
    const result = await mutate(CreateMolliePaymentIntentMutation, {input}, {useAuthToken: true});
    const intent = result.data.createMolliePaymentIntent;

    if (intent.__typename === 'MolliePaymentIntent') {
        return {ok: true, url: intent.url};
    }

    return {ok: false, errorCode: intent.errorCode, message: intent.message};
}

/** Mollie methods enabled on the profile, as filtered by the plugin for the active order. */
export async function getMolliePaymentMethods(
    paymentMethodCode: string = MOLLIE_PAYMENT_METHOD_CODE,
): Promise<MolliePaymentMethod[]> {
    const result = await query(GetMolliePaymentMethodsQuery, {input: {paymentMethodCode}}, {useAuthToken: true});
    return result.data.molliePaymentMethods;
}

/**
 * Logos and names for the "Online bezahlen" tile. The query calls the Mollie API, so it is
 * best effort: without a configured key or without network the tile falls back to text.
 */
export async function getMolliePaymentMethodSummaries(): Promise<MolliePaymentMethodSummary[]> {
    try {
        const methods = await getMolliePaymentMethods();
        return methods.map((method) => ({
            code: method.code,
            description: method.description ?? null,
            imageSvg: method.image?.svg ?? null,
            image1x: method.image?.size1x ?? null,
            image2x: method.image?.size2x ?? null,
        }));
    } catch (error) {
        console.warn('Checkout: could not load the Mollie payment methods for the online payment tile', error);
        return [];
    }
}
