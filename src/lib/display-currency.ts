/**
 * Display-currency model.
 *
 * Orders are always placed in CHF: the Vendure channel is CHF-only and the storefront
 * never sends a currencyCode to the shop API. EUR is a display-only conversion of the
 * NET CHF price at a fixed factor (CHF x 1.1). The visitor's choice is stored in a cookie
 * so a server wrapper can pass it to DisplayCurrencyProvider if desired.
 *
 * All amounts are handled in minor units (Rappen) exactly as Vendure returns them.
 */
export const DISPLAY_CURRENCIES = { CHF: 1, EUR: 1.1 } as const;

export type DisplayCurrency = keyof typeof DISPLAY_CURRENCIES;

/** The only currency orders are placed in. */
export const ORDER_CURRENCY: DisplayCurrency = 'CHF';

export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = 'CHF';

export const DISPLAY_CURRENCY_COOKIE = 'gg-display-currency';

/** One year, in seconds. */
export const DISPLAY_CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** App locale -> Intl locale used for price formatting (Swiss number formatting for both). */
const PRICE_LOCALES: Record<string, string> = {
    de: 'de-CH',
    en: 'en-CH',
};

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DISPLAY_CURRENCIES, value);
}

export function toPriceLocale(locale: string): string {
    return PRICE_LOCALES[locale] ?? PRICE_LOCALES.de;
}

/** Convert CHF minor units into minor units of the display currency (rounded). */
export function convertMinorUnits(minorUnits: number, displayCurrency: DisplayCurrency): number {
    return Math.round(minorUnits * DISPLAY_CURRENCIES[displayCurrency]);
}

/**
 * Format a NET CHF amount (minor units) in the selected display currency.
 * `locale` is the app locale ('de' | 'en'); formatting uses de-CH / en-CH.
 */
export function formatMoney(minorUnits: number, displayCurrency: DisplayCurrency, locale: string): string {
    return new Intl.NumberFormat(toPriceLocale(locale), {
        style: 'currency',
        currency: displayCurrency,
    }).format(convertMinorUnits(minorUnits, displayCurrency) / 100);
}

/**
 * Read the display currency from a raw cookie string (`document.cookie` or a Cookie header).
 * Unknown or missing values fall back to CHF.
 */
export function parseDisplayCurrencyCookie(cookieString: string | null | undefined): DisplayCurrency {
    if (!cookieString) {
        return DEFAULT_DISPLAY_CURRENCY;
    }
    for (const part of cookieString.split(';')) {
        const separator = part.indexOf('=');
        if (separator === -1) {
            continue;
        }
        const name = part.slice(0, separator).trim();
        if (name !== DISPLAY_CURRENCY_COOKIE) {
            continue;
        }
        const value = decodeURIComponent(part.slice(separator + 1).trim());
        return isDisplayCurrency(value) ? value : DEFAULT_DISPLAY_CURRENCY;
    }
    return DEFAULT_DISPLAY_CURRENCY;
}
