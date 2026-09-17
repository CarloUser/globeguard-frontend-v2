import {toIntlLocale} from '@/i18n/locale-utils';

/**
 * Ported from the old storefront (services/blog/date.ts), now keyed on the storefront's
 * Intl locale mapping (de -> de-CH, en -> en-CH) instead of a private table.
 */

export function parseBlogDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const normalizedValue = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalizedValue);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Numeric date, e.g. 17.09.2026 for de-CH. */
export function formatBlogDate(value: string | null | undefined, locale: string): string {
    const parsed = parseBlogDate(value);
    if (!parsed) {
        return value || '';
    }

    return new Intl.DateTimeFormat(toIntlLocale(locale), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(parsed);
}

/** Numeric date with time, e.g. 17.09.2026, 14:05 for de-CH. */
export function formatBlogDateTime(value: string | null | undefined, locale: string): string {
    const parsed = parseBlogDate(value);
    if (!parsed) {
        return value || '';
    }

    return new Intl.DateTimeFormat(toIntlLocale(locale), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed);
}

/** ISO-8601 string for `<time dateTime>` and JSON-LD, or undefined when unparsable. */
export function toIsoDate(value?: string | null): string | undefined {
    const parsed = parseBlogDate(value);
    return parsed ? parsed.toISOString() : undefined;
}
