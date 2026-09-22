'use server';

import {headers} from 'next/headers';
import {getLocale} from 'next-intl/server';
import {trackOrder, type TrackOrderResult} from '@/lib/vendure/order-tracking';

const MAX_CODE_LENGTH = 32;
const MAX_EMAIL_LENGTH = 254;

/**
 * Visitor address for the backend's per-IP rate limiter: first `X-Forwarded-For` hop, else
 * `X-Real-IP`. Missing behind a plain `next start` without a proxy, in which case the backend
 * falls back to the storefront server's address.
 */
async function getClientIp(): Promise<string | null> {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get('x-forwarded-for');
    const first = forwardedFor?.split(',')[0]?.trim();
    if (first) {
        return first;
    }
    return requestHeaders.get('x-real-ip')?.trim() || null;
}

/**
 * Looks up a placed order by code + e-mail. Inputs outside the backend's accepted shape are
 * answered with `not-found` locally (the backend would return null for them anyway), which
 * keeps the response indistinguishable from an unknown code.
 */
export async function trackOrderAction(code: string, emailAddress: string): Promise<TrackOrderResult> {
    const trimmedCode = String(code ?? '').trim();
    const trimmedEmail = String(emailAddress ?? '').trim();

    if (
        trimmedCode.length === 0 ||
        trimmedCode.length > MAX_CODE_LENGTH ||
        trimmedEmail.length === 0 ||
        trimmedEmail.length > MAX_EMAIL_LENGTH
    ) {
        return {status: 'not-found'};
    }

    const [locale, clientIp] = await Promise.all([getLocale(), getClientIp()]);
    return trackOrder(trimmedCode, trimmedEmail, {locale, clientIp});
}
