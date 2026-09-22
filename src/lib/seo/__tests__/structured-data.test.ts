import {describe, expect, it, vi} from 'vitest';

// structured-data.ts reads the site origin from '@/lib/metadata', which pulls in next-intl's
// navigation (and therefore next/navigation) — not resolvable in a plain node test run.
vi.mock('@/lib/metadata', () => ({
    SITE_NAME: 'GlobeGuard',
    SITE_URL: 'https://globeguard.ch',
    buildCanonicalUrl: (path: string) => `https://globeguard.ch${path.startsWith('/') ? path : `/${path}`}`,
}));

import {buildBreadcrumbJsonLd, buildProductJsonLd} from '../structured-data';

const base = {
    name: 'GlobeGuard BASIC – CAR',
    sku: 'GG-BASIC-CAR',
    url: '/products/globeguard-basic-car',
    priceMinorUnits: 58300,
};

describe('buildProductJsonLd', () => {
    it('emits a single Offer with the NET price when there is one price', () => {
        const jsonLd = buildProductJsonLd(base) as Record<string, never>;
        const offers = jsonLd.offers as unknown as Record<string, unknown>;

        expect(offers['@type']).toBe('Offer');
        expect(offers.price).toBe('583.00');
        expect(offers.priceCurrency).toBe('CHF');
        expect(offers.url).toBe('https://globeguard.ch/products/globeguard-basic-car');
        expect(offers.availability).toBe('https://schema.org/InStock');
        // The shop quotes NET, and the offer has to say so or Google reads it as gross.
        expect((offers.priceSpecification as Record<string, unknown>).valueAddedTaxIncluded).toBe(false);
    });

    it('aggregates when the variants span a price range, as the page shows "ab CHF"', () => {
        const jsonLd = buildProductJsonLd({
            ...base,
            highPriceMinorUnits: 85000,
            offerCount: 4,
        }) as Record<string, never>;
        const offers = jsonLd.offers as unknown as Record<string, unknown>;

        expect(offers['@type']).toBe('AggregateOffer');
        expect(offers.lowPrice).toBe('583.00');
        expect(offers.highPrice).toBe('850.00');
        expect(offers.offerCount).toBe(4);
        // A range has no single price: claiming one is what triggers the Search Console mismatch.
        expect(offers.price).toBeUndefined();
    });

    it('stays a single Offer when every variant costs the same', () => {
        const jsonLd = buildProductJsonLd({
            ...base,
            highPriceMinorUnits: base.priceMinorUnits,
            offerCount: 3,
        }) as Record<string, never>;

        expect((jsonLd.offers as unknown as Record<string, unknown>)['@type']).toBe('Offer');
    });

    it('makes relative image paths absolute and leaves absolute ones alone', () => {
        const jsonLd = buildProductJsonLd({
            ...base,
            images: ['/assets/preview/a.jpg', 'https://cdn.example.com/b.jpg', null, undefined],
        }) as Record<string, never>;

        expect(jsonLd.image).toEqual(['https://globeguard.ch/assets/preview/a.jpg', 'https://cdn.example.com/b.jpg']);
    });

    it('omits description, sku and image rather than emitting empty values', () => {
        const jsonLd = buildProductJsonLd({name: base.name, url: base.url, priceMinorUnits: 1000}) as Record<
            string,
            never
        >;

        expect(jsonLd.description).toBeUndefined();
        expect(jsonLd.sku).toBeUndefined();
        expect(jsonLd.image).toBeUndefined();
        expect((jsonLd.brand as unknown as Record<string, unknown>).name).toBe('GlobeGuard');
    });
});

describe('buildBreadcrumbJsonLd', () => {
    it('numbers the trail from 1 and makes every item absolute', () => {
        const jsonLd = buildBreadcrumbJsonLd([
            {name: 'Start', url: '/'},
            {name: 'Zubehör', url: '/produkte/kategorie/zubehoer'},
            {name: 'Kabel', url: 'https://globeguard.ch/products/kabel'},
        ]) as Record<string, never>;

        expect(jsonLd.itemListElement).toEqual([
            {'@type': 'ListItem', position: 1, name: 'Start', item: 'https://globeguard.ch/'},
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Zubehör',
                item: 'https://globeguard.ch/produkte/kategorie/zubehoer',
            },
            {'@type': 'ListItem', position: 3, name: 'Kabel', item: 'https://globeguard.ch/products/kabel'},
        ]);
    });
});
