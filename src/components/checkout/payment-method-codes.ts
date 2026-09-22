/**
 * Client-safe payment constants shared by the checkout steps, the review step and the
 * server-side helpers in src/lib/vendure/mollie.ts (which must not be imported from client
 * components because it reaches next/headers through the auth cookie).
 *
 * Decisions A5 / O5: online payments run through ONE Vendure payment method with the code
 * 'mollie', rendered as a single "Online bezahlen" tile (Mollie shows its own method
 * selection on the hosted checkout, immediate capture). 'invoice' stays for approved
 * company customers and is handled offline via addPaymentToOrder.
 */

export const MOLLIE_PAYMENT_METHOD_CODE = 'mollie';
export const INVOICE_PAYMENT_METHOD_CODE = 'invoice';

export function isMolliePaymentMethod(code: string | null | undefined): boolean {
    return (code ?? '').toLowerCase() === MOLLIE_PAYMENT_METHOD_CODE;
}

/** Display order of the payment tiles: online payment first, invoice second, anything else after. */
const PAYMENT_METHOD_ORDER: readonly string[] = [MOLLIE_PAYMENT_METHOD_CODE, INVOICE_PAYMENT_METHOD_CODE];

export function paymentMethodSortIndex(code: string): number {
    const index = PAYMENT_METHOD_ORDER.indexOf(code.toLowerCase());
    return index === -1 ? PAYMENT_METHOD_ORDER.length : index;
}

/** One Mollie method (TWINT, card, ...) as passed to the client for the tile logos. */
export interface MolliePaymentMethodSummary {
    code: string;
    description: string | null;
    imageSvg: string | null;
    image1x: string | null;
    image2x: string | null;
}

/** Keys under the Payment.errors.* namespace. */
export type PaymentErrorKey =
    | 'orderPaymentState'
    | 'ineligiblePaymentMethod'
    | 'orderStateTransition'
    | 'paymentDeclined'
    | 'paymentFailed'
    | 'noActiveOrder'
    | 'generic';

/**
 * Vendure ErrorResult codes the checkout can run into while placing an order, mapped to
 * translated explanations. MolliePaymentIntentError uses ORDER_PAYMENT_STATE_ERROR (order
 * not payable / no api key / missing customer name) and INELIGIBLE_PAYMENT_METHOD_ERROR
 * (method not eligible / incomplete address); the offline path can also yield the
 * payment declined / failed codes from addPaymentToOrder.
 */
const ERROR_CODE_KEYS: Record<string, PaymentErrorKey> = {
    ORDER_PAYMENT_STATE_ERROR: 'orderPaymentState',
    INELIGIBLE_PAYMENT_METHOD_ERROR: 'ineligiblePaymentMethod',
    ORDER_STATE_TRANSITION_ERROR: 'orderStateTransition',
    PAYMENT_DECLINED_ERROR: 'paymentDeclined',
    PAYMENT_FAILED_ERROR: 'paymentFailed',
    NO_ACTIVE_ORDER_ERROR: 'noActiveOrder',
};

export function paymentErrorKey(errorCode: string | null | undefined): PaymentErrorKey | null {
    return errorCode ? (ERROR_CODE_KEYS[errorCode] ?? null) : null;
}
