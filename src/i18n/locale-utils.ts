import {routing, type Locale} from './routing';

/**
 * Locale mapping for a Swiss shop:
 * - `de` formats as Swiss German (de-CH: apostrophe thousands separator, dd.mm.yyyy).
 * - `en` formats as en-CH (Swiss number/currency conventions with English wording).
 * Open Graph locales use the underscore form; there is no widely supported `en_CH`, so `en_US` is used.
 */
const OG_LOCALE_MAP: Record<Locale, string> = {de: 'de_CH', en: 'en_US'};
const INTL_LOCALE_MAP: Record<Locale, string> = {de: 'de-CH', en: 'en-CH'};

export function toOgLocale(locale: string): string {
    return OG_LOCALE_MAP[locale as Locale] || OG_LOCALE_MAP[routing.defaultLocale];
}

export function toIntlLocale(locale: string): string {
    return INTL_LOCALE_MAP[locale as Locale] || INTL_LOCALE_MAP[routing.defaultLocale];
}

/**
 * Public path prefix for a locale under `localePrefix: 'as-needed'`:
 * the default locale (de) has no prefix, every other locale is prefixed.
 */
export function localePathPrefix(locale: string): string {
    return locale === routing.defaultLocale ? '' : `/${locale}`;
}

/**
 * Build the public path for a route in a locale, e.g. ('en', '/support') -> '/en/support', ('de', '/') -> '/'.
 */
export function localizedPath(locale: string, path: string): string {
    const cleanPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
    return `${localePathPrefix(locale)}${cleanPath}` || '/';
}
