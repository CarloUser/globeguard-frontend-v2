import {cache} from 'react';
import {graphql, readFragment, type ResultOf} from '@/graphql';
import {query} from './api';

/**
 * Catalogue reads for the GlobeGuard tier pages (BASIC / WoMo / PRO / ELITE), the
 * device finder and the products hub.
 *
 * - Products carry `customFields.tierKey` (BASIC, WOMO, PRO, ELITE, ELITE_CARS_MIXED_10,
 *   ELITE_FULL, PRO_ERWEITERUNG) and `customFields.brandGroupId`; both are filterable on
 *   the shop API `products` query (verified against the running backend, see
 *   `GetTierProductsQuery`).
 * - Variant `price` is the NET amount in Rappen (`activeChannel.pricesIncludeTax = false`);
 *   VAT is added at checkout. Display with `<Price/>` + `<VatNote/>`.
 * - Every fetch is tagged `products` so `POST /api/revalidate` can purge it once a
 *   cross-request cache is introduced (see src/lib/vendure/cached.ts).
 */

export const CATALOG_TIER_KEYS = [
    'BASIC',
    'WOMO',
    'PRO',
    'ELITE',
    'ELITE_CARS_MIXED_10',
    'ELITE_FULL',
    'PRO_ERWEITERUNG',
] as const;

export type CatalogTierKey = (typeof CATALOG_TIER_KEYS)[number];

/** All product tier keys that make up the ELITE (B2B) line. */
export const ELITE_LINE_TIER_KEYS: readonly CatalogTierKey[] = ['ELITE', 'ELITE_CARS_MIXED_10', 'ELITE_FULL'];

const PRODUCTS_TAG = 'products';

/**
 * Vendure caps a single list query at 100 items (`shopListQueryLimit`). The largest tier
 * currently holds 76 products; `totalItems` is returned so callers can detect overflow.
 */
const TIER_PAGE_SIZE = 100;

export const CatalogProductFragment = graphql(`
    fragment CatalogProduct on Product {
        id
        slug
        name
        description
        featuredAsset {
            id
            preview
            source
        }
        customFields {
            brandGroupId
            tierKey
        }
        variants {
            id
            sku
            name
            price
            currencyCode
            customFields {
                compatibleFromYear
                compatibleToYear
            }
            options {
                id
                code
                name
                group {
                    id
                    code
                    name
                }
            }
        }
    }
`);

export const GetTierProductsQuery = graphql(`
    query GetTierProducts($tierKey: String!, $take: Int!) {
        products(options: { filter: { tierKey: { eq: $tierKey } }, take: $take, sort: { name: ASC } }) {
            totalItems
            items {
                ...CatalogProduct
            }
        }
    }
`, [CatalogProductFragment]);

export const GetCatalogProductBySlugQuery = graphql(`
    query GetCatalogProductBySlug($slug: String!) {
        product(slug: $slug) {
            ...CatalogProduct
            assets {
                id
                name
                preview
                source
            }
            collections {
                id
                slug
                name
                parent {
                    id
                    slug
                }
            }
        }
    }
`, [CatalogProductFragment]);

export const GetCollectionChildrenQuery = graphql(`
    query GetCollectionChildren($slug: String!) {
        collection(slug: $slug) {
            id
            slug
            name
            description
            featuredAsset {
                id
                preview
            }
            children {
                id
                slug
                name
                description
                featuredAsset {
                    id
                    preview
                }
            }
        }
    }
`);

/**
 * Several products in one round-trip. The shop API `products` list accepts
 * `slug: { in: [...] }` (StringOperators.in, verified against the running backend in both
 * locales), so the add-on products of a product page need no per-slug fan-out.
 */
export const GetProductsBySlugsQuery = graphql(`
    query GetProductsBySlugs($slugs: [String!]!, $take: Int!) {
        products(options: { filter: { slug: { in: $slugs } }, take: $take }) {
            totalItems
            items {
                ...CatalogProduct
            }
        }
    }
`, [CatalogProductFragment]);

/** Minimal projection for price teasers: one round-trip per tier, variants only. */
export const GetTierMinPriceQuery = graphql(`
    query GetTierMinPrice($tierKey: String!, $take: Int!) {
        products(options: { filter: { tierKey: { eq: $tierKey } }, take: $take }) {
            totalItems
            items {
                variants {
                    price
                    currencyCode
                }
            }
        }
    }
`);

export type CatalogProduct = ResultOf<typeof GetTierProductsQuery>['products']['items'][number];
export type CatalogProductDetail = NonNullable<ResultOf<typeof GetCatalogProductBySlugQuery>['product']>;
export type CatalogCollection = NonNullable<ResultOf<typeof GetCollectionChildrenQuery>['collection']>;
export type CatalogCollectionChild = NonNullable<CatalogCollection['children']>[number];

export interface TierProducts {
    tierKey: CatalogTierKey;
    totalItems: number;
    items: CatalogProduct[];
}

/** Minimum NET variant price (Rappen) per tier; `null` when the tier has no products. */
export type TierMinPrices = Record<CatalogTierKey, number | null>;

/** All products of one tier (name-sorted, translated), e.g. every BASIC device. */
export const getTierProducts = cache(async (tierKey: CatalogTierKey, locale: string): Promise<TierProducts> => {
    const result = await query(
        GetTierProductsQuery,
        {tierKey, take: TIER_PAGE_SIZE},
        {languageCode: locale, tags: [PRODUCTS_TAG]},
    );
    return {
        tierKey,
        totalItems: result.data.products.totalItems,
        items: result.data.products.items,
    };
});

/** Single product with custom fields, variants, assets and collection membership; `null` if unknown. */
export const getProductBySlug = cache(async (slug: string, locale: string): Promise<CatalogProductDetail | null> => {
    const result = await query(
        GetCatalogProductBySlugQuery,
        {slug},
        {languageCode: locale, tags: [PRODUCTS_TAG, `product-${slug}`]},
    );
    return result.data.product ?? null;
});

/**
 * React `cache()` compares arguments by identity, so the batch is keyed by a normalised
 * (deduplicated, sorted, comma-joined) slug list instead of the caller's array instance.
 */
const getProductsBySlugKey = cache(async (slugKey: string, locale: string): Promise<Record<string, CatalogProduct>> => {
    const slugs = slugKey.split(',').filter(Boolean);
    if (slugs.length === 0) {
        return {};
    }
    const result = await query(
        GetProductsBySlugsQuery,
        {slugs, take: TIER_PAGE_SIZE},
        {languageCode: locale, tags: [PRODUCTS_TAG, ...slugs.map((slug) => `product-${slug}`)]},
    );
    return Object.fromEntries(
        result.data.products.items.map((item) => [readFragment(CatalogProductFragment, item).slug, item] as const),
    );
});

/**
 * Products for a list of slugs in ONE request, keyed by slug; unknown slugs are absent.
 * Used by the product page to load the add-on products (SGW licences / bypass cables,
 * PRO Erweiterungen, Truma cable set) that `getRequiredAddOnSkus` asks for — map the SKUs
 * with `skuToProductSlug` and re-key the result with `indexAddOnProductsBySku`
 * (src/lib/globeguard/catalog-adapter.ts).
 */
export async function getProductsBySlugs(slugs: readonly string[], locale: string): Promise<Record<string, CatalogProduct>> {
    const key = Array.from(new Set(slugs.filter(Boolean))).sort().join(',');
    return getProductsBySlugKey(key, locale);
}

/** A collection and its direct child collections (e.g. `zubehoer` -> sgw-bypass, adapterkabel, ...); `null` if unknown. */
export const getCollectionChildren = cache(async (slug: string, locale: string): Promise<CatalogCollection | null> => {
    const result = await query(
        GetCollectionChildrenQuery,
        {slug},
        {languageCode: locale, tags: [PRODUCTS_TAG, `collection-${slug}`]},
    );
    return result.data.collection ?? null;
});

function minVariantPrice(items: Array<{variants: Array<{price: number}>}>): number | null {
    let min: number | null = null;
    for (const item of items) {
        for (const variant of item.variants) {
            if (min === null || variant.price < min) {
                min = variant.price;
            }
        }
    }
    return min;
}

/**
 * Minimum NET variant price per tier for "ab CHF ..." teasers. Tiers are fetched in
 * parallel; a tier without products yields `null` so the UI can hide the price.
 */
export const getTierMinPrices = cache(async (locale: string): Promise<TierMinPrices> => {
    const entries = await Promise.all(
        CATALOG_TIER_KEYS.map(async (tierKey) => {
            const result = await query(
                GetTierMinPriceQuery,
                {tierKey, take: TIER_PAGE_SIZE},
                {languageCode: locale, tags: [PRODUCTS_TAG]},
            );
            return [tierKey, minVariantPrice(result.data.products.items)] as const;
        }),
    );
    return Object.fromEntries(entries) as TierMinPrices;
});

/** Smallest defined price across several tiers (e.g. the whole ELITE line); `null` when none has products. */
export function minTierPrice(prices: TierMinPrices, tierKeys: readonly CatalogTierKey[]): number | null {
    const values = tierKeys.map((key) => prices[key]).filter((value): value is number => value !== null);
    return values.length ? Math.min(...values) : null;
}
