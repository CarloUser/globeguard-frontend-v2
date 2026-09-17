import {getCurrencyCookie} from './currency';
import {getActiveChannelCached} from './vendure/cached';

/**
 * Get the active currency code for the current request.
 * Reads from cookie, falls back to channel default.
 *
 * Safe inside 'use cache: private' because cookies are part of the per-user cache key.
 * NOT safe inside public 'use cache' - pass currency as a parameter instead.
 */
export async function getActiveCurrencyCode(): Promise<string> {
    const cookieValue = await getCurrencyCookie();
    const channel = await getActiveChannelCached();

    if (cookieValue && (channel.availableCurrencyCodes as string[]).includes(cookieValue)) {
        return cookieValue;
    }

    return channel.defaultCurrencyCode;
}