import {cache} from 'react';
import {graphql, type ResultOf} from '@/graphql';
import {query} from '@/lib/vendure/api';

/**
 * Store-locator plugin (backend `StoreLocatorPlugin`, shop API `storeLocations`).
 *
 * The shop resolver only returns published locations, so no `published` filter is
 * needed here. The entity carries a single free-text `address` (no structured
 * city/country fields), so grouping is by `type` only; a country grouping needs a
 * backend schema change first.
 */
export const GetStoreLocationsQuery = graphql(`
    query GetStoreLocations($options: StoreLocationListOptions) {
        storeLocations(options: $options) {
            totalItems
            items {
                id
                name
                type
                lat
                lng
                hours
                address
                phone
                bookingUrl
                detailsUrl
            }
        }
    }
`);

export type StoreLocationType = 'store' | 'workshop';

export type StoreLocation = ResultOf<typeof GetStoreLocationsQuery>['storeLocations']['items'][number];

/** Vendure's default shop list limit; paginate above it. */
const PAGE_SIZE = 100;
/** Hard cap so a runaway list can never turn one page render into hundreds of requests. */
const MAX_LOCATIONS = 500;

/**
 * All published store locations, sorted by name. Wrapped in React `cache()` so
 * `generateMetadata` and the page body share one round-trip per request.
 */
export const getStoreLocations = cache(async (): Promise<StoreLocation[]> => {
    const items: StoreLocation[] = [];
    let skip = 0;
    let totalItems = 0;

    do {
        const result = await query(GetStoreLocationsQuery, {
            options: {skip, take: PAGE_SIZE, sort: {name: 'ASC'}},
        });
        const page = result.data.storeLocations;
        totalItems = page.totalItems;
        items.push(...page.items);
        skip += PAGE_SIZE;
        if (page.items.length === 0) {
            break;
        }
    } while (skip < totalItems && items.length < MAX_LOCATIONS);

    return items;
});

export function isStoreLocationType(value: string): value is StoreLocationType {
    return value === 'store' || value === 'workshop';
}

/** Locations grouped by type, workshops first (the partner page is "Partnerwerkstätten"). */
export function groupStoreLocationsByType(
    locations: readonly StoreLocation[],
): Array<{type: StoreLocationType; items: StoreLocation[]}> {
    const order: StoreLocationType[] = ['workshop', 'store'];
    return order
        .map((type) => ({
            type,
            items: locations.filter((location) => (isStoreLocationType(location.type) ? location.type : 'store') === type),
        }))
        .filter((group) => group.items.length > 0);
}
