'use server';

import {updateTag} from 'next/cache';
import {graphql} from '@/graphql';
import {query} from '@/lib/vendure/api';

const GetOrderStateByCodeQuery = graphql(`
    query GetOrderStateByCode($code: String!) {
        orderByCode(code: $code) {
            id
            code
            state
        }
    }
`);

export interface OrderPaymentState {
    code: string;
    state: string;
}

/**
 * Polled by the confirmation page while the Mollie webhook settles the payment (the 3.5.5
 * plugin has no syncMolliePaymentStatus mutation). Runs with the customer's auth cookie:
 * orderByCode is owner-scoped and accounts are mandatory, so a foreign code yields null.
 *
 * `invalidateCart` clears the cart / active-order tags once the customer is back from the
 * hosted checkout so the navbar and the cart page no longer show the paid order.
 */
export async function getOrderPaymentState(
    code: string,
    options?: {invalidateCart?: boolean},
): Promise<OrderPaymentState | null> {
    if (options?.invalidateCart) {
        updateTag('cart');
        updateTag('active-order');
    }

    try {
        const {data} = await query(GetOrderStateByCodeQuery, {code}, {useAuthToken: true});
        const order = data.orderByCode;
        return order ? {code: order.code, state: order.state} : null;
    } catch (error) {
        // FORBIDDEN (foreign code) or a transient backend error: the poller keeps trying until its timeout.
        console.warn(`Order confirmation: could not read the state of order ${code}`, error);
        return null;
    }
}
