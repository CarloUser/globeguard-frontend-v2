import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {localizedPath} from '@/i18n/locale-utils';
import {getSiteUrl} from '@/lib/metadata';
import {getBlogSlugs} from '@/lib/vendure/blog';
import {getSitemapCollections, getSitemapProducts, type SitemapEntry} from '@/lib/vendure/sitemap-data';

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
    /** Pages that send `robots: noindex` are kept in the map for completeness but never emitted. */
    noindex?: boolean;
}

/**
 * Static public routes from the frozen route map (C:/GlobeGuard/docs).
 * Dynamic entries appended below: /blog/[slug] (blog plugin), /products/[slug] (every
 * enabled product) and /produkte/kategorie/[slug] (every public collection).
 */
const STATIC_ROUTES: readonly StaticRoute[] = [
    {path: '/', changeFrequency: 'daily', priority: 1, implemented: true},
    {path: '/geraet-finden', changeFrequency: 'weekly', priority: 0.9, implemented: true},
    {path: '/produkte', changeFrequency: 'weekly', priority: 0.9, implemented: true},
    {path: '/produkte/basic', changeFrequency: 'weekly', priority: 0.8, implemented: true},
    {path: '/produkte/pro', changeFrequency: 'weekly', priority: 0.8, implemented: true},
    {path: '/produkte/womo', changeFrequency: 'weekly', priority: 0.8, implemented: true},
    {path: '/produkte/elite', changeFrequency: 'weekly', priority: 0.8, implemented: true},
    {path: '/warum-globeguard', changeFrequency: 'monthly', priority: 0.7, implemented: true},
    {path: '/unterstuetzte-marken', changeFrequency: 'weekly', priority: 0.8, implemented: true},
    {path: '/support', changeFrequency: 'weekly', priority: 0.7, implemented: true},
    {path: '/support/sgw', changeFrequency: 'monthly', priority: 0.6, implemented: true},
    {path: '/blog', changeFrequency: 'weekly', priority: 0.6, implemented: true},
    {path: '/faq', changeFrequency: 'monthly', priority: 0.6, implemented: true},
    {path: '/kontakt', changeFrequency: 'monthly', priority: 0.5, implemented: true},
    {path: '/track-order', changeFrequency: 'yearly', priority: 0.3, implemented: true, noindex: true},
    {path: '/partner', changeFrequency: 'monthly', priority: 0.5, implemented: true},
    {path: '/ueber-uns', changeFrequency: 'monthly', priority: 0.5, implemented: true},
    {path: '/zahlungsarten', changeFrequency: 'yearly', priority: 0.3, implemented: true},
    {path: '/versand', changeFrequency: 'yearly', priority: 0.3, implemented: true},
    {path: '/impressum', changeFrequency: 'yearly', priority: 0.2, implemented: true},
    {path: '/agb', changeFrequency: 'yearly', priority: 0.2, implemented: true},
    {path: '/datenschutz', changeFrequency: 'yearly', priority: 0.2, implemented: true},
    {path: '/widerruf', changeFrequency: 'yearly', priority: 0.2, implemented: true},
];

const BLOG_SITEMAP_LIMIT = 1000;

function absoluteUrl(siteUrl: string, locale: string, path: string): string {
    return `${siteUrl}${localizedPath(locale, path)}`;
}

/** One sitemap entry per locale for a locale-agnostic path, with hreflang alternates. */
function localizedEntries(
    siteUrl: string,
    path: string,
    lastModified: Date,
    changeFrequency: ChangeFrequency,
    priority: number,
): MetadataRoute.Sitemap {
    // hreflang alternates: de = unprefixed root, en = /en prefixed, x-default = de.
    const languages: Record<string, string> = Object.fromEntries(
        routing.locales.map((locale) => [locale, absoluteUrl(siteUrl, locale, path)])
    );
    languages['x-default'] = absoluteUrl(siteUrl, routing.defaultLocale, path);

    return routing.locales.map((locale) => ({
        url: absoluteUrl(siteUrl, locale, path),
        lastModified,
        changeFrequency,
        priority,
        alternates: {languages},
    }));
}

/** Backend timestamp -> Date, falling back to `now` when missing or unparsable. */
function toLastModified(value: string | null | undefined, now: Date): Date {
    if (!value) {
        return now;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? now : parsed;
}

/**
 * Published blog posts (newest 1000). A backend outage must not break the whole sitemap,
 * so failures degrade to "no blog entries".
 */
async function blogEntries(siteUrl: string, now: Date): Promise<MetadataRoute.Sitemap> {
    try {
        const posts = await getBlogSlugs(BLOG_SITEMAP_LIMIT);
        return posts.flatMap((post) =>
            localizedEntries(siteUrl, `/blog/${post.slug}`, toLastModified(post.lastModified, now), 'monthly', 0.5)
        );
    } catch (error) {
        console.error('sitemap: blog entries skipped', error);
        return [];
    }
}

/** Shop-API driven section; degrades to an empty list so one failing query never breaks the sitemap. */
async function catalogEntries(
    label: string,
    siteUrl: string,
    now: Date,
    load: () => Promise<SitemapEntry[]>,
    toPath: (slug: string) => string,
    changeFrequency: ChangeFrequency,
    priority: number,
): Promise<MetadataRoute.Sitemap> {
    try {
        const entries = await load();
        return entries.flatMap((entry) =>
            localizedEntries(siteUrl, toPath(entry.slug), toLastModified(entry.lastModified, now), changeFrequency, priority)
        );
    } catch (error) {
        console.error(`sitemap: ${label} entries skipped`, error);
        return [];
    }
}

/** /products/[slug] for every enabled product. */
function productEntries(siteUrl: string, now: Date): Promise<MetadataRoute.Sitemap> {
    return catalogEntries('product', siteUrl, now, getSitemapProducts, (slug) => `/products/${slug}`, 'weekly', 0.7);
}

/** /produkte/kategorie/[slug] for every public collection. */
function collectionEntries(siteUrl: string, now: Date): Promise<MetadataRoute.Sitemap> {
    return catalogEntries(
        'collection',
        siteUrl,
        now,
        getSitemapCollections,
        (slug) => `/produkte/kategorie/${slug}`,
        'weekly',
        0.6,
    );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = getSiteUrl();
    const now = new Date();

    const staticEntries = STATIC_ROUTES.filter((route) => route.implemented && !route.noindex).flatMap((route) =>
        localizedEntries(siteUrl, route.path, now, route.changeFrequency, route.priority)
    );

    const [products, collections, posts] = await Promise.all([
        productEntries(siteUrl, now),
        collectionEntries(siteUrl, now),
        blogEntries(siteUrl, now),
    ]);

    return [...staticEntries, ...products, ...collections, ...posts];
}
