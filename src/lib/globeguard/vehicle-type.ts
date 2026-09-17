/**
 * Vehicle-type icon key derived from a GlobeGuard SKU, plus the icon path and
 * DE/EN labels (business data; the UI may translate via the key instead).
 * Icons: owner-provided flat silhouettes in public/images/vehicle-types/.
 *
 * Ported 1:1 from the previous storefront (VehicleTypeBadge.tsx).
 */

export type VehicleTypeKey =
    | 'car'
    | 'moto'
    | 'truck'
    | 'bus'
    | 'trailer'
    | 'womo'
    | 'agrar'
    | 'industrial'
    | 'all';

export const VEHICLE_TYPE_LABELS: Record<VehicleTypeKey, { de: string; en: string }> = {
    car: { de: 'PKW & Van', en: 'Car & Van' },
    moto: { de: 'Motorrad', en: 'Motorcycle' },
    truck: { de: 'LKW', en: 'Truck' },
    bus: { de: 'Bus', en: 'Bus' },
    trailer: { de: 'Trailer', en: 'Trailer' },
    womo: { de: 'Wohnmobil', en: 'Motorhome' },
    agrar: { de: 'Landmaschinen', en: 'Agricultural machinery' },
    industrial: { de: 'Industrie', en: 'Industrial' },
    all: { de: 'Alle Fahrzeugklassen', en: 'All vehicle classes' },
};

/** Derive the vehicle-type icon key from a GlobeGuard SKU (null = no badge). */
export function vehicleTypeFromSku(sku: string | null | undefined): VehicleTypeKey | null {
    const normalized = String(sku || '').toUpperCase();

    if (!normalized.startsWith('GG-')) return null;

    if (normalized === 'GG-BASIC-WOMO' || normalized.includes('-WOMO-') || normalized.endsWith('-WOMO')) return 'womo';
    if (normalized.includes('TRUMA')) return 'womo';
    if (normalized === 'GG-ELITE-FULL-MB' || normalized.includes('-ELITE-FULL-')) return 'all';
    if (normalized === 'GG-ELITE-BUS-MB') return 'bus';
    if (normalized.includes('-CAR') || normalized.includes('-CARS') || normalized.includes('-INEOS') || normalized.includes('ELITE-MIXED')) return 'car';
    if (normalized.includes('-MOTO')) return 'moto';
    if (normalized.includes('-TRAILER')) return 'trailer';
    if (normalized.includes('-TRUCK')) return 'truck';
    if (normalized.includes('-AGRAR')) return 'agrar';
    if (normalized.includes('-INDUSTRIAL')) return 'industrial';

    return null;
}

/** Public path of the vehicle-type icon (served from public/images/vehicle-types/). */
export function vehicleTypeIconPath(type: VehicleTypeKey): string {
    return `/images/vehicle-types/${type}.png`;
}

/** DE/EN label of a vehicle type for the given locale ('en…' → English, otherwise German). */
export function vehicleTypeLabel(type: VehicleTypeKey, locale?: string | null): string {
    const en = String(locale ?? '').toLowerCase().startsWith('en');

    return en ? VEHICLE_TYPE_LABELS[type].en : VEHICLE_TYPE_LABELS[type].de;
}
