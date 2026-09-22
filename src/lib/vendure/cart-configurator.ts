/**
 * Server-side helper that adds a configured product (device + SGW / Erweiterung / Truma
 * add-on lines) to the active order in ONE `addItemsToOrder` call, carrying the picker
 * selections as OrderLine custom fields (selectedBrandGroupId, selectedYear,
 * selectedBrandGroupIds).
 *
 * Used by the `addConfiguredItemsAction` server action in
 * src/app/[locale]/products/[slug]/actions.ts. Not a server action itself (no 'use server')
 * so it can only be reached from server code.
 */
import {graphql} from '@/graphql';
import {setAuthToken} from '@/lib/auth';
import type {CartLineInput, OrderLineSelection} from '@/lib/globeguard/types';
import {mutate, query} from '@/lib/vendure/api';
import {TransitionOrderToStateMutation} from '@/lib/vendure/mutations';

export const AddItemsToOrderMutation = graphql(`
    mutation AddItemsToOrder($inputs: [AddItemInput!]!) {
        addItemsToOrder(inputs: $inputs) {
            order {
                id
                code
                state
                totalQuantity
                subTotal
                lines {
                    id
                    quantity
                    unitPrice
                    linePrice
                    customFields {
                        selectedBrandGroupId
                        selectedYear
                        selectedBrandGroupIds
                    }
                    productVariant {
                        id
                        sku
                        name
                        product {
                            id
                            name
                            slug
                        }
                    }
                }
            }
            errorResults {
                __typename
                ... on OrderModificationError {
                    errorCode
                    message
                }
                ... on OrderLimitError {
                    errorCode
                    message
                }
                ... on NegativeQuantityError {
                    errorCode
                    message
                }
                ... on InsufficientStockError {
                    errorCode
                    message
                }
                ... on OrderInterceptorError {
                    errorCode
                    message
                }
            }
        }
    }
`);

const GetActiveOrderStateForConfiguratorQuery = graphql(`
    query GetActiveOrderStateForConfigurator {
        activeOrder {
            id
            code
            state
        }
    }
`);

export interface AddConfiguredLinesError {
    errorCode: string;
    message: string;
}

export interface AddConfiguredLinesResult {
    orderId: string;
    orderCode: string;
    state: string;
    totalQuantity: number;
    lines: Array<{
        id: string;
        quantity: number;
        sku: string;
        variantName: string;
        productName: string;
        productSlug: string;
        customFields: OrderLineSelection;
    }>;
    /** Per-input failures (stock, order limits, interceptors); the other inputs were still added. */
    errorResults: AddConfiguredLinesError[];
}

/**
 * Vendure only accepts new lines while the order is in AddingItems. A customer who backed
 * out of the payment step still has an order in ArrangingPayment, so move it back first
 * (ArrangingPayment -> AddingItems is a permitted transition). Without an active order
 * nothing needs to happen: addItemsToOrder creates one.
 */
async function ensureOrderIsAddingItems(): Promise<void> {
    const current = await query(GetActiveOrderStateForConfiguratorQuery, {}, {useAuthToken: true});
    const activeOrder = current.data.activeOrder;

    if (!activeOrder || activeOrder.state !== 'ArrangingPayment') {
        return;
    }

    const result = await mutate(TransitionOrderToStateMutation, {state: 'AddingItems'}, {useAuthToken: true});

    if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
        const errorResult = result.data.transitionOrderToState;
        throw new Error(`Failed to reopen order for editing: ${errorResult.errorCode} - ${errorResult.message}`);
    }
}

/** Only send the customFields argument when at least one selection is set (previous storefront behaviour). */
function toCustomFieldsInput(selection: OrderLineSelection | undefined): OrderLineSelection | undefined {
    if (!selection) {
        return undefined;
    }

    const input: OrderLineSelection = {};

    if (selection.selectedBrandGroupId) {
        input.selectedBrandGroupId = selection.selectedBrandGroupId;
    }
    if (typeof selection.selectedYear === 'number' && Number.isFinite(selection.selectedYear)) {
        input.selectedYear = selection.selectedYear;
    }
    if (selection.selectedBrandGroupIds) {
        input.selectedBrandGroupIds = selection.selectedBrandGroupIds;
    }

    return Object.keys(input).length > 0 ? input : undefined;
}

/**
 * Add the cart lines produced by `buildCartLines` (base device first, then the add-on
 * lines in plan order) to the active order. The guest session token Vendure returns
 * for a fresh anonymous order is persisted in the auth cookie so the cart survives.
 */
export async function addConfiguredLines(lines: CartLineInput[]): Promise<AddConfiguredLinesResult> {
    if (lines.length === 0) {
        throw new Error('No cart lines to add');
    }

    await ensureOrderIsAddingItems();

    const inputs = lines.map((line) => {
        const customFields = toCustomFieldsInput(line.customFields);

        return {
            productVariantId: line.productVariantId,
            quantity: line.quantity,
            ...(customFields ? {customFields} : {}),
        };
    });

    const result = await mutate(AddItemsToOrderMutation, {inputs}, {useAuthToken: true});

    if (result.token) {
        await setAuthToken(result.token);
    }

    const {order, errorResults} = result.data.addItemsToOrder;

    return {
        orderId: order.id,
        orderCode: order.code,
        state: order.state,
        totalQuantity: order.totalQuantity,
        lines: order.lines.map((line) => ({
            id: line.id,
            quantity: line.quantity,
            sku: line.productVariant.sku,
            variantName: line.productVariant.name,
            productName: line.productVariant.product.name,
            productSlug: line.productVariant.product.slug,
            customFields: {
                selectedBrandGroupId: line.customFields?.selectedBrandGroupId ?? undefined,
                selectedYear: line.customFields?.selectedYear ?? undefined,
                selectedBrandGroupIds: line.customFields?.selectedBrandGroupIds ?? undefined,
            },
        })),
        errorResults: errorResults.map((entry) => ({
            errorCode: entry.errorCode,
            message: entry.message,
        })),
    };
}
