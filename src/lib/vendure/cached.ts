import {cache} from 'react';
import {query} from './api';
import {GetActiveChannelQuery, GetAvailableCountriesQuery, GetTopCollectionsQuery} from './queries';

/**
 * Shared shop-API reads used by layout-level components (navbar, 404 page, checkout).
 *
 * Caching model (deliberately simple in this phase):
 * - Nothing here is cached across requests. Every helper is a live shop-API fetch wrapped in
 *   React `cache()`, so the components of one request (navbar + page + not-found) share a
 *   single round-trip per helper/argument.
 * - On-demand revalidation (`POST /api/revalidate`, see src/app/api/revalidate/route.ts) only
 *   affects fetches that opt into `next: { tags }` through the `tags` option of `query()`.
 *   The tag vocabulary is: cart, active-order, products, collection, product-<slug>,
 *   collection-<slug>. When a cross-request cache is introduced, use `'use cache'` +
 *   `cacheTag(...)` here with those same tags so the webhook keeps working.
 */

/** Active channel (language settings). Language-independent. */
export const getActiveChannelCached = cache(async () => {
    const result = await query(GetActiveChannelQuery);
    return result.data.activeChannel;
});

/** Available countries; names are translatable, so the locale is required. */
export const getAvailableCountriesCached = cache(async (locale: string) => {
    const result = await query(GetAvailableCountriesQuery, undefined, {languageCode: locale});
    return result.data.availableCountries || [];
});

/** Root-level collections (topLevelOnly); names are translatable, so the locale is required. */
export const getTopCollections = cache(async (locale: string) => {
    const result = await query(GetTopCollectionsQuery, undefined, {languageCode: locale});
    return result.data.collections.items;
});
