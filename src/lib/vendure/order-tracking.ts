import {graphql, type ResultOf} from '@/graphql';
import {query} from '@/lib/vendure/api';

/**
 * Public order lookup for /track-order (backend OrderTrackingPlugin, shop API `trackOrder`).
 *
 * - `trackOrder(code, emailAddress)` returns the customer-safe `TrackedOrder` view or `null`
 *   when the code is unknown, the order is still a cart, or the e-mail does not match. The
 *   three cases are indistinguishable by design; the UI must not guess which input was wrong.
 * - The backend rate-limits per client IP (60 / 10 min) and per IP + code (10 / 10 min) and
 *   then fails with a GraphQL error `extensions.code = 'TOO_MANY_ATTEMPTS'` whose message is
 *   already translated by the backend (`languageCode` query parameter).
 * - Because the storefront calls the shop API server-side, every visitor would share the
 *   Next.js server's IP budget. Callers therefore pass the visitor's address, forwarded as
 *   `X-Forwarded-For` (honoured by the backend's `trustProxy` setting).
 */

export const TrackOrderQuery = graphql(`
    query TrackOrder($code: String!, $emailAddress: String!) {
        trackOrder(code: $code, emailAddress: $emailAddress) {
            code
            state
            orderPlacedAt
            currencyCode
            subTotal
            shippingWithTax
            totalWithTax
            shippingLines {
                shippingMethod {
                    name
                }
            }
            lines {
                quantity
                productVariant {
                    name
                    sku
                }
                customFields {
                    selectedBrandGroupId
                    selectedYear
                    selectedBrandGroupIds
                }
            }
            fulfillments {
                state
                trackingCode
                method
                createdAt
            }
            payments {
                state
                method
                amount
            }
        }
    }
`);

export type TrackedOrder = NonNullable<ResultOf<typeof TrackOrderQuery>['trackOrder']>;
export type TrackedOrderLine = TrackedOrder['lines'][number];
export type TrackedFulfillment = TrackedOrder['fulfillments'][number];
export type TrackedPayment = TrackedOrder['payments'][number];

export type TrackOrderResult =
    | {status: 'found'; order: TrackedOrder}
    | {status: 'not-found'}
    | {status: 'too-many-attempts'}
    | {status: 'error'};

export interface TrackOrderOptions {
    /** Storefront locale; forwarded as `languageCode` so backend messages and names are translated. */
    locale?: string;
    /** Visitor IP forwarded to the backend rate limiter (see module header). */
    clientIp?: string | null;
}

/**
 * The shop-API client (src/lib/vendure/api.ts) surfaces GraphQL errors as a plain `Error`
 * carrying only the joined messages, not `extensions.code`. Until that client exposes the
 * code, the rate-limit error is recognised by the two backend message templates
 * (OrderTrackingPlugin: 'Zu viele Versuche...' / 'Too many attempts...').
 */
const TOO_MANY_ATTEMPTS_MESSAGE_PATTERNS: readonly RegExp[] = [/zu viele versuche/i, /too many attempts/i];

export function isTooManyAttemptsError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return TOO_MANY_ATTEMPTS_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

/** Loose client-side shape check mirroring the backend (`^[A-Z0-9][A-Z0-9_-]{2,31}$` after trim + upper-case). */
export function normalizeOrderCode(value: string): string {
    return value.trim().toUpperCase();
}

export async function trackOrder(
    code: string,
    emailAddress: string,
    {locale, clientIp}: TrackOrderOptions = {},
): Promise<TrackOrderResult> {
    const headers: Record<string, string> = {};
    if (clientIp) {
        headers['X-Forwarded-For'] = clientIp;
    }

    try {
        const result = await query(
            TrackOrderQuery,
            {code: normalizeOrderCode(code), emailAddress: emailAddress.trim()},
            {
                languageCode: locale,
                fetch: {headers, cache: 'no-store'},
            },
        );
        const order = result.data.trackOrder;
        return order ? {status: 'found', order} : {status: 'not-found'};
    } catch (error) {
        if (isTooManyAttemptsError(error)) {
            return {status: 'too-many-attempts'};
        }
        console.error('[order-tracking] trackOrder failed', error);
        return {status: 'error'};
    }
}
