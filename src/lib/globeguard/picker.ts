/**
 * GlobeGuard picker domain logic: vehicle type → brand → model year.
 *
 * Data source: src/data/brand-compatibility.json (generated from
 * GlobeGuard_Markenverwendung.xlsx by the backend build script — never edit by hand).
 *
 * Rules (owner spec, 2026-07-05):
 * - Prices are vehicle-type-specific, so the picker starts with the vehicle type.
 * - BASIC/PRO: Truck, Bus and Trailer are ONE combined category with a single
 *   shared brand dropdown (vehicleGroups TRUCK&BUS + TRAILER merged).
 * - ELITE splits them: Bus → ELITE Bus Multibrand, Truck/Trailer → ELITE
 *   LKW/Trailer Multibrand. A Bus customer must never land on Truck/Trailer.
 *
 * Ported 1:1 from the previous storefront (src/services/globeguard-picker.ts).
 * German labels in the constants are business data, not UI copy; `labelEn`
 * carries the English variant where the previous module had one.
 */
import brandCompatibility from '@/data/brand-compatibility.json';

export type TierKey = 'BASIC' | 'WOMO' | 'PRO' | 'ELITE';

export interface IBrandGroup {
    id: string;
    displayName: string;
    vehicleGroup: string;
    tiers: string[];
    basicFromYear?: number;
    sgw?: {
        bypass?: { fromYear: number; toYear: number | null };
        license?: { fromYear: number; toYear: number | null; licenseGroup: string };
    };
    /** ACCESSORIES modules (Truma): the PRO add-on product that occupies a brand slot. */
    proAddOnSku?: string;
    /** Cable that must be offered when this module/device is selected (like SGW). */
    requiresCableSku?: string;
    /** Pure-EV lineup — the storefront must not promise DPF/AdBlue/injector features. */
    evOnly?: boolean;
}

export interface IVehicleTypeOption {
    key: string;
    /** German label shown in the picker. */
    label: string;
    /** English label (shown on the /en locale). */
    labelEn: string;
    /** vehicleGroup values from brand-compatibility.json covered by this option. */
    vehicleGroups: string[];
}

/** Pick the display label of a picker entry for the active locale. */
export function localizedLabel(entry: { label: string; labelEn?: string }, locale?: string | null): string {
    return String(locale ?? '').toLowerCase().startsWith('en') && entry.labelEn ? entry.labelEn : entry.label;
}

export const PRO_FROM_YEAR: number = (brandCompatibility as { proFromYear: number }).proFromYear || 1991;
export const BASIC_FROM_YEAR: number = (brandCompatibility as { basicFromYear: number }).basicFromYear || 2008;

export const ALL_BRAND_GROUPS: IBrandGroup[] = (
    brandCompatibility as unknown as { brandGroups: IBrandGroup[] }
).brandGroups;

/** Vehicle-type options for the BASIC and PRO pickers (Truck/Bus/Trailer combined). */
export const CONSUMER_VEHICLE_TYPES: IVehicleTypeOption[] = [
    { key: 'car', label: 'PKW & Van', labelEn: 'Car & Van', vehicleGroups: ['CARS&VANS'] },
    { key: 'moto', label: 'Motorrad', labelEn: 'Motorcycle', vehicleGroups: ['BIKE'] },
    { key: 'truck', label: 'LKW / Bus / Trailer', labelEn: 'Truck / Bus / Trailer', vehicleGroups: ['TRUCK&BUS', 'TRAILER'] },
    { key: 'agrar', label: 'Landmaschinen (Agrar)', labelEn: 'Agricultural machinery', vehicleGroups: ['AGRAR'] },
    { key: 'industrial', label: 'Industriefahrzeuge', labelEn: 'Industrial vehicles', vehicleGroups: ['INDUSTRIAL'] },
];

/** Brands of one tier + vehicle-type option, alphabetically sorted. */
export function getBrandsForTier(tier: TierKey, vehicleType: IVehicleTypeOption): IBrandGroup[] {
    return ALL_BRAND_GROUPS
        .filter((group) => group.tiers.includes(tier))
        .filter((group) => vehicleType.vehicleGroups.includes(group.vehicleGroup))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'de-CH'));
}

/** Vehicle-type options that actually have brands in the given tier. */
export function getVehicleTypesForTier(tier: TierKey): IVehicleTypeOption[] {
    return CONSUMER_VEHICLE_TYPES.filter((vehicleType) => getBrandsForTier(tier, vehicleType).length > 0);
}

/** First model year selectable for a tier (+ brand for BASIC per-brand overrides). */
export function getFromYear(tier: TierKey, brand?: IBrandGroup | null): number {
    // WoMo is the BASIC platform (CAN-only, ~2008+) with the Truma module.
    if (tier === 'BASIC' || tier === 'WOMO') {
        return brand?.basicFromYear || BASIC_FROM_YEAR;
    }

    return PRO_FROM_YEAR;
}

export function getSelectableYears(tier: TierKey, brand?: IBrandGroup | null): number[] {
    const fromYear = getFromYear(tier, brand);
    const currentYear = new Date().getFullYear() + 1;
    const years: number[] = [];

    for (let year = currentYear; year >= fromYear; year -= 1) {
        years.push(year);
    }

    return years;
}

export interface ISgwRequirement {
    type: 'bypass-cable' | 'license';
    detail: string;
}

/** SGW requirements of a brand for a given model year (empty if none). */
export function getSgwRequirements(brand: IBrandGroup, year: number): ISgwRequirement[] {
    const requirements: ISgwRequirement[] = [];
    const { sgw } = brand;

    if (!sgw) {
        return requirements;
    }

    if (sgw.bypass
        && year >= sgw.bypass.fromYear
        && (sgw.bypass.toYear === null || sgw.bypass.toYear === undefined || year <= sgw.bypass.toYear)) {
        // Two physical cables exist: IVE for the IVECO Daily, FCCA for the Fiat group.
        const cable = brand.id.includes('iveco') ? 'IVE' : 'FCCA';
        requirements.push({ type: 'bypass-cable', detail: cable });
    }

    if (sgw.license
        && year >= sgw.license.fromYear
        && (sgw.license.toYear === null || sgw.license.toYear === undefined || year <= sgw.license.toYear)) {
        requirements.push({ type: 'license', detail: sgw.license.licenseGroup });
    }

    return requirements;
}

/**
 * ELITE device routing by vehicle type. SKUs from the seeded catalog.
 * Bus deliberately routes to the Bus Multibrand device, NOT Truck/Trailer.
 */
export interface IEliteDevice {
    sku: string;
    /** German display label for routing cards. */
    label: string;
    /** English label (shown on the /en locale). */
    labelEn: string;
    vehicleTypeKeys: string[];
}

export const ELITE_DEVICES: IEliteDevice[] = [
    { sku: 'GG-ELITE-CARS-MX', label: 'ELITE Cars Mixed (4–10 Markengruppen)', labelEn: 'ELITE Cars Mixed (4–10 brand groups)', vehicleTypeKeys: ['car'] },
    { sku: 'GG-ELITE-CARS-MB', label: 'ELITE Cars Multibrand', labelEn: 'ELITE Cars Multibrand', vehicleTypeKeys: ['car'] },
    { sku: 'GG-ELITE-MOTO-MB', label: 'ELITE Motorrad Multibrand', labelEn: 'ELITE Motorcycle Multibrand', vehicleTypeKeys: ['moto'] },
    { sku: 'GG-ELITE-BUS-MB', label: 'ELITE Bus Multibrand', labelEn: 'ELITE Bus Multibrand', vehicleTypeKeys: ['bus'] },
    { sku: 'GG-ELITE-TRUCK-MB', label: 'ELITE LKW/Trailer Multibrand', labelEn: 'ELITE Truck/Trailer Multibrand', vehicleTypeKeys: ['truck-trailer'] },
    { sku: 'GG-ELITE-FULL-MB', label: 'ELITE Full – alle Klassen', labelEn: 'ELITE Full – all classes', vehicleTypeKeys: ['all'] },
];

/** ELITE vehicle-type options: Bus and LKW/Trailer are SEPARATE here. */
export const ELITE_VEHICLE_TYPES: Array<{ key: string; label: string; labelEn: string }> = [
    { key: 'car', label: 'PKW & Van', labelEn: 'Car & Van' },
    { key: 'moto', label: 'Motorrad', labelEn: 'Motorcycle' },
    { key: 'bus', label: 'Bus', labelEn: 'Bus' },
    { key: 'truck-trailer', label: 'LKW / Trailer', labelEn: 'Truck / Trailer' },
    { key: 'all', label: 'Alle Klassen', labelEn: 'All classes' },
];

export function getEliteDevicesForVehicleType(vehicleTypeKey: string): IEliteDevice[] {
    return ELITE_DEVICES.filter((device) => device.vehicleTypeKeys.includes(vehicleTypeKey));
}

// ---------------------------------------------------------------------------
// Add-on SKU resolution (Erweiterung / SGW license / SGW cable)
// ---------------------------------------------------------------------------

/** Accessory modules (Truma) selectable as a PRO brand slot. */
export function getProAddOnModules(): IBrandGroup[] {
    return ALL_BRAND_GROUPS.filter((group) => group.vehicleGroup === 'ACCESSORIES' && group.proAddOnSku);
}

/** PRO Erweiterung SKU for an additional brand group (null if no extension product exists for the class). */
export function getErweiterungSku(brand: IBrandGroup): string | null {
    if (brand.proAddOnSku) {
        return brand.proAddOnSku;
    }

    if (brand.id.includes('ineos')) {
        return 'GG-PRO-EXT-CAR-INEOS';
    }

    switch (brand.vehicleGroup) {
    case 'CARS&VANS':
        return 'GG-PRO-EXT-CAR';
    case 'BIKE':
        return 'GG-PRO-EXT-MOTO';
    case 'TRUCK&BUS':
    case 'TRAILER':
        return 'GG-PRO-EXT-TRUCK';
    default:
        return null;
    }
}

/** SGW licence groups referenced by brand-compatibility.json (`sgw.license.licenseGroup`). */
export type SgwLicenseGroup = 'stellantis' | 'mercedes' | 'vag' | 'hyundaiKia';

/** Physical SGW bypass cables (`ISgwRequirement.detail` for type 'bypass-cable'). */
export type SgwCableCode = 'IVE' | 'FCCA';

export const SGW_LICENSE_SKUS: Record<string, string> = {
    stellantis: 'GG-SGW-LIC-STELLANTIS',
    mercedes: 'GG-SGW-LIC-MERCEDES',
    vag: 'GG-SGW-LIC-VAG',
    hyundaiKia: 'GG-SGW-LIC-HYUNDAI-KIA',
};

export const SGW_CABLE_SKUS: Record<string, string> = {
    IVE: 'GG-SGW-CABLE-IVE',
    FCCA: 'GG-SGW-CABLE-FCCA',
};

export function skuToProductSlug(sku: string): string {
    return sku.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export type DurationCode = 'day' | 'week' | 'month' | 'year';

export const SGW_LICENSE_DURATIONS: Array<{ code: DurationCode; label: string; labelEn: string }> = [
    { code: 'day', label: '1 Tag', labelEn: '1 day' },
    { code: 'week', label: '1 Woche', labelEn: '1 week' },
    { code: 'month', label: '1 Monat', labelEn: '1 month' },
    { code: 'year', label: '1 Jahr', labelEn: '1 year' },
];

// ---------------------------------------------------------------------------
// PRO extra-brand selections (brand + optional model year) in the URL
// ---------------------------------------------------------------------------

export interface IExtraBrandSelection {
    brandGroupId: string;
    /** Model year if the customer already knows the target vehicle. */
    year: number | null;
}

/** Alias without the legacy `I` prefix (same shape). */
export type ExtraBrandSelection = IExtraBrandSelection;

/** Serialize as `id:year,id` (year omitted when unknown). */
export function encodeExtraBrands(selections: IExtraBrandSelection[]): string {
    return selections
        .filter((selection) => selection.brandGroupId)
        .map((selection) => (selection.year ? `${selection.brandGroupId}:${selection.year}` : selection.brandGroupId))
        .join(',');
}

export function decodeExtraBrands(raw: string | null | undefined): IExtraBrandSelection[] {
    if (!raw) {
        return [];
    }

    return raw.split(',').filter(Boolean).map((entry) => {
        const [brandGroupId, yearPart] = entry.split(':');

        return {
            brandGroupId,
            year: Number(yearPart) || null,
        };
    }).filter((selection) => selection.brandGroupId);
}

// ---------------------------------------------------------------------------
// ELITE Cars Mixed (4–10 brand groups, chosen at purchase)
// ---------------------------------------------------------------------------

export const ELITE_MIXED_SKU = 'GG-ELITE-CARS-MX';
export const ELITE_MIXED_MIN_BRANDS = 4;
export const ELITE_MIXED_MAX_BRANDS = 10;

/** Brand groups eligible for ELITE Cars Mixed: all PKW/VAN groups. */
export function getEliteMixedEligibleBrands(): IBrandGroup[] {
    return ALL_BRAND_GROUPS
        .filter((group) => group.vehicleGroup === 'CARS&VANS')
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'de-CH'));
}

export function getBrandGroupName(brandGroupId: string | null | undefined): string | null {
    if (!brandGroupId) {
        return null;
    }

    return ALL_BRAND_GROUPS.find((group) => group.id === brandGroupId)?.displayName || null;
}

/** Short badge text for a cart/order line's configurator selections. */
export function formatSelectionBadge(selection: {
    selectedBrandGroupId?: string | null;
    selectedYear?: number | null;
    selectedBrandGroupIds?: string | null;
}, locale?: string | null): string | null {
    const en = String(locale ?? '').toLowerCase().startsWith('en');

    if (selection.selectedBrandGroupIds) {
        const count = selection.selectedBrandGroupIds.split(',').filter(Boolean).length;

        return en ? `${count} brand groups selected` : `${count} Markengruppen gewählt`;
    }

    const parts: string[] = [];
    const brandName = getBrandGroupName(selection.selectedBrandGroupId);

    if (brandName) {
        parts.push(brandName);
    }

    if (selection.selectedYear) {
        parts.push(en ? `Model year ${selection.selectedYear}` : `Modelljahr ${selection.selectedYear}`);
    }

    return parts.length > 0 ? parts.join(' · ') : null;
}
