import {graphql, type ResultOf} from '@/graphql';
import {query} from '@/lib/vendure/api';
import type {CatalogCollection} from '@/lib/vendure/catalog';
import {ProductCardFragment} from '@/lib/vendure/fragments';

/**
 * Data for the generic collection listing (/produkte/kategorie/[slug]) on the standard
 * Vendure search index.
 *
 * Handles both leaf collections (products directly inside) and hierarchy nodes like
 * `zubehoer` / `services` / `software-updates`, whose products live in child collections —
 * those render as one section per child. Ported from the previous storefront
 * (src/pages/produkte/kategorie/[slug].tsx + src/api/graphql/catalog.api.ts).
 */

export const CategoryListingSearchQuery = graphql(`
    query CategoryListingSearch($input: SearchInput!) {
        search(input: $input) {
            totalItems
            items {
                ...ProductCard
            }
        }
    }
`, [ProductCardFragment]);

export type CategoryListingItem = ResultOf<typeof CategoryListingSearchQuery>['search']['items'][number];

export interface CategoryListingSection {
    slug: string;
    title: string;
    description: string | null;
    items: CategoryListingItem[];
}

/**
 * Collections with page-owned DE/EN copy (Tiers.category.known.*). Every other slug uses
 * the collection name/description from Vendure.
 */
export const KNOWN_COLLECTION_KEYS: Record<string, string> = {
    zubehoer: 'zubehoer',
    services: 'services',
    'software-updates': 'softwareUpdates',
};

/** Largest child collection currently holds 20 products; Vendure caps a search at 100. */
const LISTING_PAGE_SIZE = 96;

/** Products of one collection via the search index, grouped by product; an outage yields an empty list. */
async function searchCollectionProducts(collectionSlug: string, locale: string): Promise<CategoryListingItem[]> {
    try {
        const result = await query(
            CategoryListingSearchQuery,
            {input: {collectionSlug, groupByProduct: true, take: LISTING_PAGE_SIZE}},
            {languageCode: locale, tags: ['products', `collection-${collectionSlug}`]},
        );
        return result.data.search.items;
    } catch (error) {
        console.error(`[produkte/kategorie] search(collectionSlug: "${collectionSlug}") failed`, error);
        return [];
    }
}

/**
 * Sections of a collection listing: the collection's own products first (leaf collections),
 * then one section per child collection that has products. Empty sections are dropped.
 */
export async function getCategoryListingSections(
    collection: CatalogCollection,
    locale: string,
): Promise<CategoryListingSection[]> {
    const children = collection.children ?? [];
    const [directItems, ...childItems] = await Promise.all([
        searchCollectionProducts(collection.slug, locale),
        ...children.map((child) => searchCollectionProducts(child.slug, locale)),
    ]);

    const sections: CategoryListingSection[] = [];
    if (directItems.length > 0) {
        sections.push({slug: collection.slug, title: collection.name, description: null, items: directItems});
    }
    children.forEach((child, index) => {
        const items = childItems[index] ?? [];
        if (items.length > 0) {
            sections.push({slug: child.slug, title: child.name, description: child.description || null, items});
        }
    });
    return sections;
}
