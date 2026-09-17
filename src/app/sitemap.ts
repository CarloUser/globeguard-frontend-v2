import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {localizedPath} from '@/i18n/locale-utils';
import {getSiteUrl} from '@/lib/metadata';

// Evaluated per request so the runtime NEXT_PUBLIC_SITE_URL is used instead of the
// value present at `next build` (one image can then serve beta and production hosts).
export const dynamic = 'force-dynamic';

type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface StaticRoute {
    path: string;
    changeFrequency: ChangeFrequency;
    priority: number;
    /**
     * Only routes with an existing page.tsx are emitted. The frozen route map is kept
     * in full so entries can be flipped on as Phase 2c/2d lands.
     */
    implemented: boolean;
}

/**
 * Static public routes from the frozen route map (C:/GlobeGuard/docs).
 * Dynamic entries (products, categories, blog posts) are not listed yet.
 * TODO(Phase 2c/2d): append /products/[slug], /produkte/kategorie/[slug] and /blog/[slug]
 * entries fetched from the Vendure shop API and the blog plugin.
 */
const STATIC_ROUTES: readonly StaticRoute[] = [
    {path: '/', changeFrequency: 'daily', priority: 1, implemented: true},
    {path: '/geraet-finden', changeFrequency: 'weekly', priority: 0.9, implemented: false},
    {path: '/produkte', changeFrequency: 'weekly', priority: 0.9, implemented: false},
    {path: '/produkte/basic', changeFrequency: 'weekly', priority: 0.8, implemented: false},
    {path: '/produkte/pro', changeFrequency: 'weekly', priority: 0.8, implemented: false},
    {path: '/produkte/womo', changeFrequency: 'weekly', priority: 0.8, implemented: false},
    {path: '/produkte/elite', changeFrequency: 'weekly', priority: 0.8, implemented: false},
    {path: '/warum-globeguard', changeFrequency: 'monthly', priority: 0.7, implemented: false},
    {path: '/unterstuetzte-marken', changeFrequency: 'weekly', priority: 0.8, implemented: false},
    {path: '/support', changeFrequency: 'weekly', priority: 0.7, implemented: true},
    {path: '/support/sgw', changeFrequency: 'monthly', priority: 0.6, implemented: false},
    {path: '/blog', changeFrequency: 'weekly', priority: 0.6, implemented: false},
    {path: '/faq', changeFrequency: 'monthly', priority: 0.6, implemented: false},
    {path: '/kontakt', changeFrequency: 'monthly', priority: 0.5, implemented: true},
    {path: '/track-order', changeFrequency: 'yearly', priority: 0.3, implemented: true},
    {path: '/partner', changeFrequency: 'monthly', priority: 0.5, implemented: true},
    {path: '/ueber-uns', changeFrequency: 'monthly', priority: 0.5, implemented: false},
    {path: '/zahlungsarten', changeFrequency: 'yearly', priority: 0.3, implemented: false},
    {path: '/versand', changeFrequency: 'yearly', priority: 0.3, implemented: false},
    {path: '/impressum', changeFrequency: 'yearly', priority: 0.2, implemented: false},
    {path: '/agb', changeFrequency: 'yearly', priority: 0.2, implemented: false},
    {path: '/datenschutz', changeFrequency: 'yearly', priority: 0.2, implemented: false},
    {path: '/widerruf', changeFrequency: 'yearly', priority: 0.2, implemented: false},
];

function absoluteUrl(siteUrl: string, locale: string, path: string): string {
    return `${siteUrl}${localizedPath(locale, path)}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = getSiteUrl();
    const now = new Date();

    return STATIC_ROUTES.filter((route) => route.implemented).flatMap((route) => {
        // hreflang alternates: de = unprefixed root, en = /en prefixed, x-default = de.
        const languages: Record<string, string> = Object.fromEntries(
            routing.locales.map((locale) => [locale, absoluteUrl(siteUrl, locale, route.path)])
        );
        languages['x-default'] = absoluteUrl(siteUrl, routing.defaultLocale, route.path);

        return routing.locales.map((locale) => ({
            url: absoluteUrl(siteUrl, locale, route.path),
            lastModified: now,
            changeFrequency: route.changeFrequency,
            priority: route.priority,
            alternates: {languages},
        }));
    });
}
