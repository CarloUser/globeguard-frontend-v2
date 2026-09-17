/**
 * VAT and shipping constants used across the app.
 * Must match backend (Vendure) where applicable.
 *
 * Cart (Vendure active order): shipping is taken from the API when possible:
 * - If the order already has a shipping method set → order.shippingWithTax is used.
 * - If not, we call eligibleShippingMethods and use the first quote's priceWithTax,
 *   so changes to the shipping method in the Vendure dashboard are reflected on the cart.
 * These constants are used as fallback (e.g. when the API fails) and for display logic.
 *
 * Ported 1:1 from the previous storefront (src/constants/vat-and-shipping.ts).
 */

/** Swiss VAT rate (8.1% MwSt). Used for tax display and fallback calculations. */
export const VAT_RATE = 0.081;

/** VAT as percentage (e.g. for labels). */
export const VAT_PERCENT = 8.1;

/**
 * Extract the VAT portion from a tax-inclusive amount.
 * Example: 108.10 with 8.1% VAT returns 8.10.
 */
export function getIncludedVatAmount(grossAmount: number, vatRate: number = VAT_RATE): number {
    return Math.round(grossAmount * (vatRate / (1 + vatRate)));
}

/**
 * Shipping fallback: 9.90 CHF (incl. VAT) if order subtotal < 200 CHF; free over 200 CHF.
 * Placeholder until GlobeGuard shipping methods are finalized in Vendure — the live quote
 * from eligibleShippingMethods always wins over these values.
 */
export const SHIPPING_FEE_CHF = 9.9;
export const FREE_SHIPPING_THRESHOLD_CHF = 200;

/**
 * Same rule in smallest unit (Rappen) for Vendure API amounts (subTotalWithTax, etc.).
 * Used as fallback when eligibleShippingMethods is not available.
 */
export const SHIPPING_FEE_RAPPEN = 990;
export const FREE_SHIPPING_THRESHOLD_RAPPEN = 20000;
