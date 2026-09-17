import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {SITE_URL} from '@/lib/metadata';

const PUBLIC_ROUTES = ['', '/search', '/support', '/partners', '/contact'] as const;

function localizedUrl(locale: string, path: string) {
    return `${SITE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return routing.locales.flatMap((locale) =>
        PUBLIC_ROUTES.map((route) => ({
            url: localizedUrl(locale, route),
            lastModified: now,
            changeFrequency: route === '' ? 'daily' : 'weekly',
            priority: route === '' ? 1 : 0.6,
        }))
    );
}