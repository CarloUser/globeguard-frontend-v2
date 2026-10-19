/**
 * Minimal CatalogProduct fixtures. SKUs and NET prices (Rappen) follow
 * globeguard-backend/data/product-catalog.csv and extras.json.
 */
import { skuToProductSlug } from '../picker';
import type { CatalogProduct, CatalogVariant } from '../types';

interface SimpleProductOptions {
    brandGroupId?: string | null;
    tierKey?: string | null;
    compatibleFromYear?: number | null;
    compatibleToYear?: number | null;
    slug?: string;
}

/** Single-variant product; variant id = `v-<sku lowercased>`. */
export function simpleProduct(sku: string, priceNet: number, name: string, options: SimpleProductOptions = {}): CatalogProduct {
    const slug = options.slug ?? skuToProductSlug(sku);

    return {
        id: `p-${slug}`,
        slug,
        name,
        sku,
        brandGroupId: options.brandGroupId ?? null,
        tierKey: options.tierKey ?? null,
        variants: [
            {
                id: `v-${slug}`,
                sku,
                name,
                priceNet,
                options: [],
                compatibleFromYear: options.compatibleFromYear ?? null,
                compatibleToYear: options.compatibleToYear ?? null,
            },
        ],
    };
}

export const LICENSE_PRICES: Record<string, number> = {
    DAY: 2000,
    WEEK: 5000,
    MONTH: 9000,
    YEAR: 37000,
};

/** Four duration variants (-DAY/-WEEK/-MONTH/-YEAR) with namespaced option codes like Vendure produces. */
export function licenseProduct(sku: string, name: string, tierKey = 'SGW_LICENSE'): CatalogProduct {
    const slug = skuToProductSlug(sku);
    const variants: CatalogVariant[] = (['DAY', 'WEEK', 'MONTH', 'YEAR'] as const).map((code) => ({
        id: `v-${slug}-${code.toLowerCase()}`,
        sku: `${sku}-${code}`,
        name: `${name} – ${code}`,
        priceNet: LICENSE_PRICES[code],
        options: [
            {
                groupCode: `${slug}-duration`,
                code: `${slug}-duration-${code.toLowerCase()}`,
                name: code,
            },
        ],
    }));

    return {
        id: `p-${slug}`,
        slug,
        name,
        sku: variants[0].sku,
        brandGroupId: null,
        tierKey,
        variants,
    };
}

// --- devices ---------------------------------------------------------------

export const basicFiat = simpleProduct('GG-BASIC-CAR-FIAT-ALFA-ROMEO-LANCIA', 62000, 'GlobeGuard BASIC – Fiat, Alfa Romeo, Lancia', {
    brandGroupId: 'cars-vans-fiat-alfa-romeo-lancia',
    tierKey: 'BASIC',
    compatibleFromYear: 2008,
});

export const basicIveco = simpleProduct('GG-BASIC-CAR-IVECO-DAILY', 62000, 'GlobeGuard BASIC – Iveco Daily', {
    brandGroupId: 'cars-vans-iveco-daily',
    tierKey: 'BASIC',
    compatibleFromYear: 2008,
});

export const basicMercedes = simpleProduct('GG-BASIC-CAR-MERCEDES-BENZ-PKW-VAN', 62000, 'GlobeGuard BASIC – Mercedes-Benz PKW & VAN', {
    brandGroupId: 'cars-vans-mercedes-benz-pkw-van',
    tierKey: 'BASIC',
    compatibleFromYear: 2008,
});

export const proFiat = simpleProduct('GG-PRO-CAR-FIAT-ALFA-ROMEO-LANCIA', 82000, 'GlobeGuard PRO – Fiat, Alfa Romeo, Lancia', {
    brandGroupId: 'cars-vans-fiat-alfa-romeo-lancia',
    tierKey: 'PRO',
    compatibleFromYear: 1991,
});

export const proBmw = simpleProduct('GG-PRO-CAR-BMW-MINI', 82000, 'GlobeGuard PRO – BMW, Mini', {
    brandGroupId: 'cars-vans-bmw-mini',
    tierKey: 'PRO',
    compatibleFromYear: 1991,
});

export const womoFiat = simpleProduct('GG-BASIC-WOMO-FIAT-ALFA-ROMEO-LANCIA', 84800, 'GlobeGuard WoMo – Fiat, Alfa Romeo, Lancia', {
    brandGroupId: 'cars-vans-fiat-alfa-romeo-lancia',
    tierKey: 'WOMO',
    compatibleFromYear: 2008,
});

export const eliteCarsMb = simpleProduct('GG-ELITE-CARS-MB', 423000, 'GlobeGuard ELITE – Cars Multibrand', {
    tierKey: 'ELITE',
    compatibleFromYear: 1991,
});

export const eliteCarsMx = simpleProduct('GG-ELITE-CARS-MX', 238000, 'GlobeGuard ELITE – Cars Mixed (4–10)', {
    tierKey: 'ELITE_CARS_MIXED_10',
    compatibleFromYear: 1991,
});

export const eliteFull = simpleProduct('GG-ELITE-FULL-MB', 593000, 'GlobeGuard ELITE Full – PKW/LKW/Trailer/Bus', {
    tierKey: 'ELITE_FULL',
    compatibleFromYear: 1991,
});

// --- PRO Erweiterungen -----------------------------------------------------

export const proExtCar = simpleProduct('GG-PRO-EXT-CAR', 32000, 'PRO Erweiterung – CARS-Markengruppe', { tierKey: 'PRO_ERWEITERUNG' });
export const proExtCarIneos = simpleProduct('GG-PRO-EXT-CAR-INEOS', 38000, 'PRO Erweiterung – INEOS', { tierKey: 'PRO_ERWEITERUNG' });
export const proExtMoto = simpleProduct('GG-PRO-EXT-MOTO', 25400, 'PRO Erweiterung – Motorradmarke', { tierKey: 'PRO_ERWEITERUNG' });
export const proExtTruck = simpleProduct('GG-PRO-EXT-TRUCK', 56000, 'PRO Erweiterung – LKW/Bus/Trailer-Marke', { tierKey: 'PRO_ERWEITERUNG' });
export const proTruma = simpleProduct('GG-PRO-TRUMA', 32000, 'PRO Erweiterung – Truma Zusatzausstattung', { tierKey: 'PRO_ERWEITERUNG' });

// --- cables / accessories --------------------------------------------------

export const sgwCableFcca = simpleProduct('GG-SGW-CABLE-FCCA', 9000, 'SGW Bypass-Kabel – Fiat-Gruppe', { tierKey: 'ZUBEHOER' });
export const sgwCableIve = simpleProduct('GG-SGW-CABLE-IVE', 9000, 'SGW Bypass-Kabel – Iveco Daily', { tierKey: 'ZUBEHOER' });
export const cableTruma = simpleProduct('GG-CABLE-TRUMA', 9000, 'Adapterkabel-Set – Truma Combi', { tierKey: 'ZUBEHOER' });

// --- licences --------------------------------------------------------------

export const licStellantis = licenseProduct('GG-SGW-LIC-STELLANTIS', 'Security Gateway – Stellantis Lizenz');
export const licMercedes = licenseProduct('GG-SGW-LIC-MERCEDES', 'Security Gateway – Mercedes-Benz Lizenz');
export const licVag = licenseProduct('GG-SGW-LIC-VAG', 'Security Gateway – VAG Lizenz');
export const licHyundaiKia = licenseProduct('GG-SGW-LIC-HYUNDAI-KIA', 'Security Gateway – Hyundai/Kia Lizenz');
export const svcFern = licenseProduct('GG-SVC-FERN', 'Ferndiagnose', 'SERVICE');

/**
 * Every add-on product the plan builder can reference, keyed by the add-on SKU
 * the domain logic resolves (product code — for licence products that is the
 * base SKU, not the `-DAY` variant SKU carried in `product.sku`).
 */
export const ALL_ADD_ON_PRODUCTS: Record<string, CatalogProduct> = {
    'GG-PRO-EXT-CAR': proExtCar,
    'GG-PRO-EXT-CAR-INEOS': proExtCarIneos,
    'GG-PRO-EXT-MOTO': proExtMoto,
    'GG-PRO-EXT-TRUCK': proExtTruck,
    'GG-PRO-TRUMA': proTruma,
    'GG-SGW-CABLE-FCCA': sgwCableFcca,
    'GG-SGW-CABLE-IVE': sgwCableIve,
    'GG-CABLE-TRUMA': cableTruma,
    'GG-SGW-LIC-STELLANTIS': licStellantis,
    'GG-SGW-LIC-MERCEDES': licMercedes,
    'GG-SGW-LIC-VAG': licVag,
    'GG-SGW-LIC-HYUNDAI-KIA': licHyundaiKia,
};

/** Variant id helper for assertions. */
export function variantId(product: CatalogProduct, durationCode?: 'day' | 'week' | 'month' | 'year'): string {
    if (!durationCode) return product.variants[0].id;

    const variant = product.variants.find((entry) => entry.sku.toUpperCase().endsWith(`-${durationCode.toUpperCase()}`));

    if (!variant) throw new Error(`No ${durationCode} variant on ${product.sku}`);

    return variant.id;
}
