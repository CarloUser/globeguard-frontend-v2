/**
 * Purchase quantity rules (min quantity, step, default) and helpers for the
 * quantity selects. Ported 1:1 from the previous storefront
 * (src/utils/purchaseQuantities.ts).
 */

export interface PurchaseQuantitySource {
    minQty?: number | null;
    quantityStep?: number | null;
    defaultQty?: number | null;
}

export interface PurchaseQuantityRules {
    minQty: number;
    quantityStep: number;
    defaultQty: number;
}

function toPositiveInteger(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }

    const rounded = Math.floor(parsed);
    return rounded >= 1 ? rounded : null;
}

export function getPurchaseQuantityRules(source?: PurchaseQuantitySource | null): PurchaseQuantityRules {
    const minQty = toPositiveInteger(source?.minQty) ?? 1;
    const quantityStep = toPositiveInteger(source?.quantityStep) ?? 1;
    const rawDefaultQty = toPositiveInteger(source?.defaultQty) ?? minQty;

    return {
        minQty,
        quantityStep,
        defaultQty: sanitizePurchaseQuantity(rawDefaultQty, { minQty, quantityStep, defaultQty: rawDefaultQty }),
    };
}

export function sanitizePurchaseQuantity(
    value: number | string | null | undefined,
    rules: PurchaseQuantityRules,
): number {
    const numericValue = typeof value === 'string' ? Number(value) : value;

    if (!Number.isFinite(numericValue)) {
        return rules.defaultQty;
    }

    if ((numericValue as number) <= rules.minQty) {
        return rules.minQty;
    }

    const offset = (numericValue as number) - rules.minQty;
    const steps = Math.ceil(offset / rules.quantityStep);

    return rules.minQty + steps * rules.quantityStep;
}

export function buildPurchaseQuantityOptions(
    rules: PurchaseQuantityRules,
    count = 20,
): number[] {
    const safeCount = Math.max(1, Math.floor(count));

    return Array.from({ length: safeCount }, (_, index) => (
        rules.minQty + rules.quantityStep * index
    ));
}
