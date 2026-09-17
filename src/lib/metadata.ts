import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'GlobeGuard';

/**
 * Public origin of the storefront (no trailing slash), resolved at call time.
 * Request-time consumers (sitemap.xml, robots.txt) call this directly so they
 * pick up the runtime NEXT_PUBLIC_SITE_URL instead of the value present at build.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');
}

export const SITE_URL = getSiteUrl();

/**
 * Truncate text to a maximum length, preserving word boundaries.
 * Strips HTML tags and is ideal for meta descriptions (recommended 150-160 chars).
 */
export function truncateDescription(
  text: string | null | undefined,
  maxLength = 155
): string {
  if (!text) return '';

  // Strip HTML tags if present
  const cleanText = text.replace(/<[^>]*>/g, '').trim();

  if (cleanText.length <= maxLength) return cleanText;

  // Find the last space before maxLength to avoid cutting words
  const truncated = cleanText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  return lastSpaceIndex > 0
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
}

/**
 * Build a canonical URL for a given path.
 */
export function buildCanonicalUrl(path: string): string {
  const baseUrl = SITE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export interface RouteAlternates {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * Canonical URL plus hreflang alternates for a locale-agnostic route.
 * Under `localePrefix: 'as-needed'` German is unprefixed and English lives under /en;
 * x-default points at the default locale (de). Use this in every page's generateMetadata
 * instead of building locale-prefixed paths by hand.
 */
export function buildAlternates(locale: string, href: string): RouteAlternates {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, buildCanonicalUrl(getPathname({ locale: l, href }))])
  );
  languages['x-default'] = languages[routing.defaultLocale];

  return {
    canonical: buildCanonicalUrl(getPathname({ locale, href })),
    languages,
  };
}

/**
 * Build Open Graph image array from an image URL.
 */
export function buildOgImages(
  imageUrl: string | null | undefined,
  alt?: string
): NonNullable<Metadata['openGraph']>['images'] {
  if (!imageUrl) return undefined;

  return [
    {
      url: imageUrl,
      alt: alt || 'Product image',
    },
  ];
}

/**
 * Create noindex/nofollow robots config for protected pages.
 */
export function noIndexRobots(): Metadata['robots'] {
  return {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  };
}
