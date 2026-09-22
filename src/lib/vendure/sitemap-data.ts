import {graphql} from '@/graphql';
import {query} from '@/lib/vendure/api';

/**
 * Slug lists for sitemap.xml (src/app/sitemap.ts).
 *
 * The shop API caps list queries at 100 items (`shopListQueryLimit`), so both helpers page
 * with `skip` until `totalItems` is reached. The shop API only ever returns enabled products
 * and non-private collections; the (never listed) root collection and leaf collections without
 * any product (they would only render the listing's empty state) are skipped. Slugs are
 * language-independent (SKU-based), so the queries run in the channel default language.
 */

const SITEMAP_PAGE_SIZE = 100;
const PRODUCTS_TAG = 'products';
const COLLECTION_TAG = 'collection';
const ROOT_COLLECTION_SLUG = '__root_collection__';

export const GetSitemapProductsQuery = graphql(`
    query GetSitemapProducts($take: Int!, $skip: Int!) {
        products(options: { take: $take, skip: $skip, sort: { id: ASC } }) {
            totalItems
            items {
                slug
                updatedAt
            }
        }
    }
`);

export const GetSitemapCollectionsQuery = graphql(`
    query GetSitemapCollections($take: Int!, $skip: Int!) {
        collections(options: { take: $take, skip: $skip, sort: { id: ASC } }) {
            totalItems
            items {
                slug
                updatedAt
                parent {
                    slug
                }
                children {
                    id
                }
                productVariants(options: { take: 1 }) {
                    totalItems
                }
            }
        }
    }
`);

export interface SitemapEntry {
    slug: string;
    /** ISO date string from the backend, or null when unknown. */
    lastModified: string | null;
}

interface PagedList<TItem> {
    totalItems: number;
    items: TItem[];
}

/** Fetches every page of a capped list query until `totalItems` is reached (or a short page arrives). */
async function fetchAllPages<TItem>(fetchPage: (take: number, skip: number) => Promise<PagedList<TItem>>): Promise<TItem[]> {
    const items: TItem[] = [];
    let skip = 0;

    for (;;) {
        const page = await fetchPage(SITEMAP_PAGE_SIZE, skip);
        items.push(...page.items);
        skip += page.items.length;
        if (page.items.length === 0 || page.items.length < SITEMAP_PAGE_SIZE || skip >= page.totalItems) {
            break;
        }
    }

    return items;
}

/** Slug + updatedAt of every product visible in the shop (enabled products only). */
export async function getSitemapProducts(): Promise<SitemapEntry[]> {
    const items = await fetchAllPages(async (take, skip) => {
        const result = await query(GetSitemapProductsQuery, {take, skip}, {tags: [PRODUCTS_TAG]});
        return result.data.products;
    });
    return items.map((item) => ({slug: item.slug, lastModified: item.updatedAt || null}));
}

/**
 * Slug + updatedAt of every public collection that has content to list: at least one product
 * variant or a child collection (private collections are never returned by the shop API).
 */
export async function getSitemapCollections(): Promise<SitemapEntry[]> {
    const items = await fetchAllPages(async (take, skip) => {
        const result = await query(GetSitemapCollectionsQuery, {take, skip}, {tags: [COLLECTION_TAG]});
        return result.data.collections;
    });
    return items
        .filter((item) => item.slug !== ROOT_COLLECTION_SLUG)
        .filter((item) => (item.children?.length ?? 0) > 0 || item.productVariants.totalItems > 0)
        .map((item) => ({slug: item.slug, lastModified: item.updatedAt || null}));
}
