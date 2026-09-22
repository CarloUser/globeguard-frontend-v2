'use server';

import {updateTag} from 'next/cache';
import {getLocale, getTranslations} from 'next-intl/server';

import {setAuthToken} from '@/lib/auth';
import type {CartLineInput, OrderLineSelection} from '@/lib/globeguard/types';
import {mutate} from '@/lib/vendure/api';
import {addConfiguredLines} from '@/lib/vendure/cart-configurator';
import {AddToCartMutation} from '@/lib/vendure/mutations';

/** Plain products (cables, updates, accessories): one variant, no custom fields. */
export async function addToCart(variantId: string, quantity: number = 1) {
    const locale = await getLocale();
    const t = await getTranslations({locale, namespace: 'Errors'});

    try {
        const result = await mutate(AddToCartMutation, {variantId, quantity}, {useAuthToken: true});

        if (result.token) {
            await setAuthToken(result.token);
        }

        if (result.data.addItemToOrder.__typename === 'Order') {
            // Revalidate cart data across all pages
            updateTag('cart');
            updateTag('active-order');
            return {success: true, order: result.data.addItemToOrder};
        } else {
            return {success: false, error: result.data.addItemToOrder.message};
        }
    } catch {
        return {success: false, error: t('failedAddToCart')};
    }
}

export type AddConfiguredItemsResult =
    | {
        success: true;
        orderCode: string;
        totalQuantity: number;
        /** Number of lines requested (device + add-ons). */
        requestedLines: number;
        /** Set when Vendure rejected some inputs (stock / limits); the rest was added. */
        partialError?: string;
    }
    | {success: false; error: string};

const MAX_LINE_QUANTITY = 999;
const MAX_LINES = 50;

/** Server-action inputs are untrusted: keep only well-formed lines and the three known custom fields. */
function sanitizeLines(lines: unknown): CartLineInput[] {
    if (!Array.isArray(lines)) {
        return [];
    }

    return lines.slice(0, MAX_LINES).flatMap((raw): CartLineInput[] => {
        if (!raw || typeof raw !== 'object') {
            return [];
        }

        const line = raw as Partial<CartLineInput>;
        const productVariantId = typeof line.productVariantId === 'string' ? line.productVariantId.trim() : '';
        const quantity = Math.floor(Number(line.quantity));

        if (!productVariantId || !Number.isFinite(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
            return [];
        }

        const customFields: OrderLineSelection = {};
        const rawFields = line.customFields && typeof line.customFields === 'object' ? line.customFields : {};

        if (typeof rawFields.selectedBrandGroupId === 'string' && rawFields.selectedBrandGroupId) {
            customFields.selectedBrandGroupId = rawFields.selectedBrandGroupId.slice(0, 96);
        }
        if (typeof rawFields.selectedYear === 'number' && Number.isInteger(rawFields.selectedYear)) {
            customFields.selectedYear = rawFields.selectedYear;
        }
        if (typeof rawFields.selectedBrandGroupIds === 'string' && rawFields.selectedBrandGroupIds) {
            customFields.selectedBrandGroupIds = rawFields.selectedBrandGroupIds.slice(0, 2048);
        }

        return [{
            productVariantId,
            quantity,
            ...(Object.keys(customFields).length > 0 ? {customFields} : {}),
        }];
    });
}

/**
 * Add a configured product (device line + SGW / Erweiterung / Truma add-on lines from
 * `buildCartLines`) to the cart in one `addItemsToOrder` call, preserving the picker
 * selections as OrderLine custom fields. The order is moved back to AddingItems first
 * when a previous checkout attempt left it in ArrangingPayment.
 */
export async function addConfiguredItemsAction(lines: CartLineInput[]): Promise<AddConfiguredItemsResult> {
    const locale = await getLocale();
    const t = await getTranslations({locale, namespace: 'Configurator.cart'});
    const sanitized = sanitizeLines(lines);

    if (sanitized.length === 0) {
        return {success: false, error: t('error')};
    }

    try {
        const result = await addConfiguredLines(sanitized);

        updateTag('cart');
        updateTag('active-order');

        const partialError = result.errorResults.length > 0
            ? result.errorResults.map((entry) => entry.message).join(', ')
            : undefined;

        return {
            success: true,
            orderCode: result.orderCode,
            totalQuantity: result.totalQuantity,
            requestedLines: sanitized.length,
            ...(partialError ? {partialError} : {}),
        };
    } catch (error) {
        console.error('[products] addConfiguredItemsAction failed', error);
        return {success: false, error: t('error')};
    }
}
