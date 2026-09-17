import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {localizedPath} from '@/i18n/locale-utils';
import {getSiteUrl} from '@/lib/metadata';

// Evaluated per request so the runtime NEXT_PUBLIC_SITE_URL decides the host (and the
// "beta." disallow-all rule) instead of the value present at `next build`.
export const dynamic = 'force-dynamic';

/**
 * Private / transactional routes that must never be indexed (see frozen route map).
 * Paths are emitted for every locale (de unprefixed, /en prefixed).
 */
const PRIVATE_ROUTES = [
    '/account',
    '/cart',
    '/checkout',
    '/order-confirmation',
    '/sign-in',
    '/register',
    '/verify',
    '/verify-pending',
    '/forgot-password',
    '/reset-password',
    '/search',
] as const;

function isBetaHost(siteUrl: string): boolean {
    try {
        return new URL(siteUrl).hostname.includes('beta.');
    } catch {
        return siteUrl.includes('beta.');
    }
}

export default function robots(): MetadataRoute.Robots {
    const siteUrl = getSiteUrl();

    // Staging / beta deployments must not be indexed at all.
    if (isBetaHost(siteUrl)) {
        return {
            rules: [{userAgent: '*', disallow: '/'}],
        };
    }

    const disallow = [
        '/api/',
        ...routing.locales.flatMap((locale) => PRIVATE_ROUTES.map((route) => localizedPath(locale, route))),
    ];

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow,
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
