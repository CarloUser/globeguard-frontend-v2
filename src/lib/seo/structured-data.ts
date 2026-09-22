import {SITE_NAME, SITE_URL, buildCanonicalUrl} from '@/lib/metadata';

/**
 * Site-wide schema.org builders (Organization, WebSite, BreadcrumbList, Product offer),
 * ported from the old storefront's services/seo/structured-data.ts. Blog-specific types
 * live in src/lib/blog/structured-data.ts. Render the result with `<JsonLdScript/>`
 * (src/components/blog/json-ld.tsx); every URL is absolute.
 */

export type JsonLd = Record<string, unknown>;

export const ORGANIZATION_LEGAL_NAME = 'GlobeGuard GmbH';
export const ORGANIZATION_EMAIL = 'info@globeguard.ch';
export const LOGO_PATH = '/globeguard-logo-transparent.png';

/** Registered office (Impressum). */
export const ORGANIZATION_ADDRESS = {
    streetAddress: 'Untermühlestrasse 12',
    postalCode: '6330',
    addressLocality: 'Cham',
    addressCountry: 'CH',
} as const;

/**
 * Social profile URLs from NEXT_PUBLIC_SOCIAL_* (each must be an absolute http(s) URL to be
 * used). The variables are referenced individually so Next.js can inline them.
 */
function socialProfileUrls(): string[] {
    const candidates = [
        process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL,
        process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL,
        process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL,
        process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL,
        process.env.NEXT_PUBLIC_SOCIAL_X_URL,
    ];
    return candidates
        .map((value) => String(value ?? '').trim())
        .filter((value) => /^https?:\/\//i.test(value));
}

export function toAbsoluteUrl(value?: string | null): string | undefined {
    if (!value) {
        return undefined;
    }
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    if (value.startsWith('//')) {
        return `https:${value}`;
    }
    return buildCanonicalUrl(value);
}

export function buildOrganizationJsonLd(): JsonLd {
    const sameAs = socialProfileUrls();
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        legalName: ORGANIZATION_LEGAL_NAME,
        url: SITE_URL,
        logo: buildCanonicalUrl(LOGO_PATH),
        email: ORGANIZATION_EMAIL,
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: ORGANIZATION_EMAIL,
            areaServed: ['CH', 'LI', 'EU'],
            availableLanguage: ['German', 'English'],
        },
        address: {
            '@type': 'PostalAddress',
            ...ORGANIZATION_ADDRESS,
        },
        ...(sameAs.length > 0 ? {sameAs} : {}),
    };
}

/** WebSite with a SearchAction pointing at the storefront search (`/search?q=`). */
export function buildWebSiteJsonLd(): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

export interface BreadcrumbEntry {
    name: string;
    /** Absolute URL, or a site-relative path (made absolute here). */
    url: string;
}

export function buildBreadcrumbJsonLd(entries: readonly BreadcrumbEntry[]): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: entries.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: entry.name,
            item: toAbsoluteUrl(entry.url),
        })),
    };
}

export type ProductAvailability = 'InStock' | 'OutOfStock' | 'PreOrder';

export interface ProductJsonLdInput {
    name: string;
    description?: string | null;
    sku?: string | null;
    /** Absolute or site-relative product page URL. */
    url: string;
    /** Absolute or site-relative image URLs. */
    images?: readonly (string | null | undefined)[];
    /** Unit price in minor units (Rappen). Prices are NET; see `priceIncludesVat`. */
    priceMinorUnits: number;
    currencyCode?: string;
    /** Whether `priceMinorUnits` already includes VAT (the shop quotes NET prices). */
    priceIncludesVat?: boolean;
    availability?: ProductAvailability;
    brand?: string | null;
}

/**
 * Product with a single Offer. The shop quotes NET prices ("zzgl. MwSt."), which Google
 * accepts as long as the amount matches the visible price; `priceIncludesVat` is exposed
 * as `valueAddedTaxIncluded` on a PriceSpecification so the offer is unambiguous.
 */
export function buildProductJsonLd(input: ProductJsonLdInput): JsonLd {
    const currency = input.currencyCode ?? 'CHF';
    const price = (input.priceMinorUnits / 100).toFixed(2);
    const images = (input.images ?? []).map((image) => toAbsoluteUrl(image)).filter(Boolean);

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: input.name,
        ...(input.description ? {description: input.description} : {}),
        ...(input.sku ? {sku: input.sku} : {}),
        ...(images.length > 0 ? {image: images} : {}),
        brand: {
            '@type': 'Brand',
            name: input.brand || SITE_NAME,
        },
        offers: {
            '@type': 'Offer',
            url: toAbsoluteUrl(input.url),
            priceCurrency: currency,
            price,
            priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price,
                priceCurrency: currency,
                valueAddedTaxIncluded: input.priceIncludesVat ?? false,
            },
            availability: `https://schema.org/${input.availability ?? 'InStock'}`,
            seller: {
                '@type': 'Organization',
                name: SITE_NAME,
            },
        },
    };
}
