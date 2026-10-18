import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';

/**
 * Catch-all for URLs no route matches. Without it an unmatched URL never reaches the [locale]
 * layout and Next serves its bare English 404 (no header, no `lang`); calling notFound() here
 * renders [locale]/not-found.tsx inside the shop layout instead, still with status 404.
 *
 * Safe against the rest of the routing: redirects (the legacy map) run before any route, the
 * /assets rewrite is an afterFiles rewrite and wins over dynamic routes, and ownRoutes() in
 * next.config.ts skips `[...]` folders. No loading.tsx may sit above this page (decision O12).
 */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'NotFound'});

    // The layout title template appends the site name. noindex: the layout's default robots
    // metadata would otherwise replace the noindex Next sets on a not-found response.
    return {title: t('title'), robots: {index: false, follow: true}};
}

export default function CatchAllNotFound() {
    notFound();
}
