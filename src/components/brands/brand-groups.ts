import brandLogos from '@/data/brand-logos.json';
import {ALL_BRAND_GROUPS, type IBrandGroup} from '@/lib/globeguard/picker';

/**
 * Pure helpers shared by /unterstuetzte-marken and /support/sgw. All data comes from
 * src/data/brand-compatibility.json (via the picker module) and src/data/brand-logos.json,
 * so these pages can never drift from the configurator logic.
 */

/** Translation keys (`vehicleGroups.*` / `sections.*`) for the raw `vehicleGroup` values of the data file. */
export type VehicleGroupKey = 'carsVans' | 'bike' | 'truckBus' | 'trailer' | 'agrar' | 'industrial' | 'accessories';

const VEHICLE_GROUP_KEYS: Record<string, VehicleGroupKey> = {
    'CARS&VANS': 'carsVans',
    BIKE: 'bike',
    'TRUCK&BUS': 'truckBus',
    TRAILER: 'trailer',
    AGRAR: 'agrar',
    INDUSTRIAL: 'industrial',
    ACCESSORIES: 'accessories',
};

/** Display order of the vehicle classes on the supported-brands page. */
export const BRAND_SECTIONS: ReadonlyArray<{key: VehicleGroupKey; vehicleGroups: string[]}> = [
    {key: 'carsVans', vehicleGroups: ['CARS&VANS']},
    {key: 'bike', vehicleGroups: ['BIKE']},
    {key: 'truckBus', vehicleGroups: ['TRUCK&BUS']},
    {key: 'trailer', vehicleGroups: ['TRAILER']},
    {key: 'agrar', vehicleGroups: ['AGRAR']},
    {key: 'industrial', vehicleGroups: ['INDUSTRIAL']},
    {key: 'accessories', vehicleGroups: ['ACCESSORIES']},
];

export function vehicleGroupKey(vehicleGroup: string): VehicleGroupKey | null {
    return VEHICLE_GROUP_KEYS[vehicleGroup] ?? null;
}

export function sortByDisplayName(groups: readonly IBrandGroup[]): IBrandGroup[] {
    return [...groups].sort((a, b) => a.displayName.localeCompare(b.displayName, 'de-CH'));
}

export function brandGroupsForVehicleGroups(vehicleGroups: readonly string[]): IBrandGroup[] {
    return sortByDisplayName(ALL_BRAND_GROUPS.filter((group) => vehicleGroups.includes(group.vehicleGroup)));
}

/** Brand groups that have any SGW requirement (bypass cable and/or licence). */
export function sgwBrandGroups(): IBrandGroup[] {
    return sortByDisplayName(ALL_BRAND_GROUPS.filter((group) => Boolean(group.sgw)));
}

export interface BrandLogoEntry {
    label: string;
    /** Public path under /images/brands; absent = render a monogram. */
    img?: string;
}

const LOGOS = brandLogos as Record<string, BrandLogoEntry[]>;

/** Logo entries of a brand group (one per brand in the group); falls back to a single monogram entry. */
export function logoEntriesFor(group: IBrandGroup): BrandLogoEntry[] {
    return LOGOS[group.id] ?? [{label: group.displayName}];
}

/** Two-letter (or three-character) monogram for brands without a logo file. */
export function monogram(label: string): string {
    const clean = label.replace(/\([^)]*\)/g, '').trim();
    const words = clean.split(/[\s-]+/).filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 3).toUpperCase();
}
