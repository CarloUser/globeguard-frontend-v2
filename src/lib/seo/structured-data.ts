import {SITE_NAME, SITE_URL, buildCanonicalUrl} from '@/lib/metadata';

/**
 * Site-wide schema.org builders (Organization, WebSite, BreadcrumbList, Product offer),
 * ported from the old storefront's services/seo/structured-data.ts. Blog-specific types
 * live in src/lib/blog/structured-data.ts. Render the result with `<JsonLdScript/>`
 * (src/components/seo/json-ld.tsx); every URL is absolute.
 */

export type JsonLd = Record<string, unknown>;

export const ORGANIZATION_LEGAL_NAME = 'GlobeGuard GmbH';
export const ORGANIZATION_EMAIL = 'info@globeguard.ch';
// Same navy file as the header logo (GlobeguardBrand)
export const LOGO_PATH = '/globeguard-logo-navy.png';

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
    /**
     * Highest variant price in minor units, when the product has variants at different prices.
     * Set it and the offer becomes an AggregateOffer over `priceMinorUnits`..`highPriceMinorUnits`,
     * which is what Google expects from a page that shows a price range ("ab CHF …"). Equal to
     * `priceMinorUnits` or omitted means a single Offer.
     */
    highPriceMinorUnits?: number;
    /** Number of variants behind an AggregateOffer. */
    offerCount?: number;
    currencyCode?: string;
    /** Whether `priceMinorUnits` already includes VAT (the shop quotes NET prices). */
    priceIncludesVat?: boolean;
    availability?: ProductAvailability;
    brand?: string | null;
}

/**
 * Product with one Offer, or an AggregateOffer when `highPriceMinorUnits` describes a range.
 * The shop quotes NET prices ("zzgl. MwSt."), which Google accepts as long as the amount matches
 * the visible price; on a single Offer `priceIncludesVat` is exposed as `valueAddedTaxIncluded`
 * on a PriceSpecification so the offer is unambiguous. AggregateOffer has no equivalent field —
 * schema.org puts no price specification on it — so a range carries lowPrice/highPrice only.
 */
export function buildProductJsonLd(input: ProductJsonLdInput): JsonLd {
    const currency = input.currencyCode ?? 'CHF';
    const price = (input.priceMinorUnits / 100).toFixed(2);
    const images = (input.images ?? []).map((image) => toAbsoluteUrl(image)).filter(Boolean);
    const url = toAbsoluteUrl(input.url);
    const availability = `https://schema.org/${input.availability ?? 'InStock'}`;
    const seller = {'@type': 'Organization', name: SITE_NAME};

    // A page that shows "ab CHF 583.00" for a product with several differently priced variants
    // must not claim a single Offer at that price: Google compares the offer with the visible
    // price and flags the mismatch. AggregateOffer is the shape for a range.
    const hasRange =
        typeof input.highPriceMinorUnits === 'number' && input.highPriceMinorUnits > input.priceMinorUnits;

    const offers = hasRange
        ? {
              '@type': 'AggregateOffer',
              url,
              priceCurrency: currency,
              lowPrice: price,
              highPrice: (input.highPriceMinorUnits! / 100).toFixed(2),
              ...(input.offerCount ? {offerCount: input.offerCount} : {}),
              availability,
              seller,
          }
        : {
              '@type': 'Offer',
              url,
              priceCurrency: currency,
              price,
              priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price,
                  priceCurrency: currency,
                  valueAddedTaxIncluded: input.priceIncludesVat ?? false,
              },
              availability,
              seller,
          };

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
        offers,
    };
}
