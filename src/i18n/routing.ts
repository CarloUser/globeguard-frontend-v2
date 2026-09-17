import {defineRouting} from 'next-intl/routing';

/**
 * German is served at the root (no prefix), English under /en/.
 * See C:/GlobeGuard/docs/DECISIONS.md (A4).
 */
export const routing = defineRouting({
    locales: ['de', 'en'],
    defaultLocale: 'de',
    localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
    de: 'Deutsch',
    en: 'English',
};
