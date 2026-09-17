import {getLocale} from 'next-intl/server';
import {routing} from './routing';

/**
 * Safe wrapper that validates the active request locale against routing config.
 */
export async function getRouteLocale(): Promise<string> {
    const loc = await getLocale();
    return (routing.locales as readonly string[]).includes(loc) ? loc : routing.defaultLocale;
}