import { describe, expect, it } from 'vitest';

import {
    ALL_BRAND_GROUPS,
    BASIC_FROM_YEAR,
    CONSUMER_VEHICLE_TYPES,
    decodeExtraBrands,
    ELITE_DEVICES,
    ELITE_MIXED_MAX_BRANDS,
    ELITE_MIXED_MIN_BRANDS,
    ELITE_MIXED_SKU,
    ELITE_VEHICLE_TYPES,
    encodeExtraBrands,
    formatSelectionBadge,
    getBrandGroupName,
    getBrandsForTier,
    getEliteDevicesForVehicleType,
    getEliteMixedEligibleBrands,
    getErweiterungSku,
    getFromYear,
    getProAddOnModules,
    getSelectableYears,
    getSgwRequirements,
    getVehicleTypesForTier,
    IBrandGroup,
    localizedLabel,
    PRO_FROM_YEAR,
    SGW_CABLE_SKUS,
    SGW_LICENSE_DURATIONS,
    SGW_LICENSE_SKUS,
    skuToProductSlug,
} from '../picker';

function group(id: string): IBrandGroup {
    const found = ALL_BRAND_GROUPS.find((entry) => entry.id === id);

    if (!found) throw new Error(`fixture brand group missing: ${id}`);

    return found;
}

const fiat = group('cars-vans-fiat-alfa-romeo-lancia');
const iveco = group('cars-vans-iveco-daily');
const mercedes = group('cars-vans-mercedes-benz-pkw-van');
const hyundai = group('cars-vans-hyundai');
const kia = group('cars-vans-kia');
const mbTruck = group('truck-bus-mercedes-benz-truck');
const vw = group('cars-vans-vw-gruppe-audi-cupra-seat-skoda-volkswagen');
const bmw = group('cars-vans-bmw-mini');
const ineos = group('cars-vans-ineos');
const ktm = group('bike-ktm');
const daf = group('truck-bus-daf');
const wabco = group('trailer-wabco');
const krone = group('agrar-krone');
const truma = group('accessories-truma');

describe('brand-compatibility data', () => {
    it('carries the expected top-level from-years and 77 groups', () => {
        expect(PRO_FROM_YEAR).toBe(1991);
        expect(BASIC_FROM_YEAR).toBe(2008);
        expect(ALL_BRAND_GROUPS).toHaveLength(77);
    });
});

describe('vehicle types per tier', () => {
    it('BASIC offers car + moto, WOMO only car, PRO all five (truck/bus/trailer merged)', () => {
        expect(getVehicleTypesForTier('BASIC').map((entry) => entry.key)).toEqual(['car', 'moto']);
        expect(getVehicleTypesForTier('WOMO').map((entry) => entry.key)).toEqual(['car']);
        expect(getVehicleTypesForTier('PRO').map((entry) => entry.key)).toEqual(['car', 'moto', 'truck', 'agrar', 'industrial']);
    });

    it('the PRO truck option merges TRUCK&BUS and TRAILER groups into one brand list', () => {
        const truckOption = CONSUMER_VEHICLE_TYPES.find((entry) => entry.key === 'truck')!;
        const ids = getBrandsForTier('PRO', truckOption).map((entry) => entry.id);

        expect(truckOption.vehicleGroups).toEqual(['TRUCK&BUS', 'TRAILER']);
        expect(ids).toContain('truck-bus-daf');
        expect(ids).toContain('trailer-wabco');
        expect(ids).toHaveLength(12);
    });

    it('WOMO car brands are the 11 chassis groups', () => {
        const carOption = CONSUMER_VEHICLE_TYPES[0];

        expect(getBrandsForTier('WOMO', carOption).map((entry) => entry.id)).toEqual([
            'cars-vans-fiat-alfa-romeo-lancia',
            'cars-vans-ford',
            'cars-vans-iveco-daily',
            'cars-vans-land-rover',
            'cars-vans-man-tg-e',
            'cars-vans-mercedes-benz-pkw-van',
            'cars-vans-nissan',
            'cars-vans-peugeot-citroen',
            'cars-vans-renault-dacia',
            'cars-vans-toyota',
            'cars-vans-vw-gruppe-audi-cupra-seat-skoda-volkswagen',
        ]);
    });

    it('brands are sorted by displayName with de-CH collation', () => {
        const carOption = CONSUMER_VEHICLE_TYPES[0];
        const names = getBrandsForTier('PRO', carOption).map((entry) => entry.displayName);
        const sorted = [...names].sort((a, b) => a.localeCompare(b, 'de-CH'));

        expect(names).toEqual(sorted);
        expect(names[0]).toBe('Bentley');
    });

    it('ELITE keeps Bus and LKW/Trailer as separate vehicle types', () => {
        expect(ELITE_VEHICLE_TYPES.map((entry) => entry.key)).toEqual(['car', 'moto', 'bus', 'truck-trailer', 'all']);
        expect(localizedLabel(ELITE_VEHICLE_TYPES[3])).toBe('LKW / Trailer');
        expect(localizedLabel(ELITE_VEHICLE_TYPES[3], 'en')).toBe('Truck / Trailer');
        expect(localizedLabel(ELITE_VEHICLE_TYPES[3], 'en-CH')).toBe('Truck / Trailer');
        expect(localizedLabel(ELITE_VEHICLE_TYPES[3], 'de')).toBe('LKW / Trailer');
    });
});

describe('model years', () => {
    it('run from next year down to the from-year, newest first', () => {
        const years = getSelectableYears('BASIC', fiat);
        const nextYear = new Date().getFullYear() + 1;

        expect(years[0]).toBe(nextYear);
        expect(years[years.length - 1]).toBe(2008);
        expect(years).toHaveLength(nextYear - 2008 + 1);
        years.forEach((year, index) => {
            if (index > 0) expect(year).toBe(years[index - 1] - 1);
        });
    });

    it('PRO years start at 1991 regardless of brand', () => {
        const years = getSelectableYears('PRO', fiat);

        expect(years[years.length - 1]).toBe(1991);
        expect(getFromYear('PRO', ineos)).toBe(1991);
        expect(getFromYear('PRO')).toBe(1991);
    });

    it('INEOS BASIC/WOMO starts at 2022 (per-brand basicFromYear override)', () => {
        expect(getFromYear('BASIC', ineos)).toBe(2022);
        expect(getFromYear('WOMO', ineos)).toBe(2022);
        expect(getFromYear('BASIC', fiat)).toBe(2008);
        expect(getFromYear('WOMO', fiat)).toBe(2008);
        expect(getFromYear('BASIC', null)).toBe(2008);
        expect(getSelectableYears('BASIC', ineos).at(-1)).toBe(2022);
    });
});

describe('getSgwRequirements', () => {
    it('Fiat 2019: bypass cable only', () => {
        expect(getSgwRequirements(fiat, 2019)).toEqual([{ type: 'bypass-cable', detail: 'FCCA' }]);
    });

    it('Fiat 2020: bypass cable + Stellantis licence (cable first)', () => {
        expect(getSgwRequirements(fiat, 2020)).toEqual([
            { type: 'bypass-cable', detail: 'FCCA' },
            { type: 'license', detail: 'stellantis' },
        ]);
    });

    it('Fiat 2021: licence only; Fiat 2017: nothing', () => {
        expect(getSgwRequirements(fiat, 2021)).toEqual([{ type: 'license', detail: 'stellantis' }]);
        expect(getSgwRequirements(fiat, 2017)).toEqual([]);
    });

    it('Iveco Daily 2018+: IVE cable, open-ended', () => {
        expect(getSgwRequirements(iveco, 2018)).toEqual([{ type: 'bypass-cable', detail: 'IVE' }]);
        expect(getSgwRequirements(iveco, 2035)).toEqual([{ type: 'bypass-cable', detail: 'IVE' }]);
        expect(getSgwRequirements(iveco, 2017)).toEqual([]);
    });

    it('Mercedes PKW 2021 → mercedes licence; 2020 → none', () => {
        expect(getSgwRequirements(mercedes, 2021)).toEqual([{ type: 'license', detail: 'mercedes' }]);
        expect(getSgwRequirements(mercedes, 2020)).toEqual([]);
    });

    it('Hyundai and Kia 2018 → hyundaiKia licence; 2017 → none', () => {
        expect(getSgwRequirements(hyundai, 2018)).toEqual([{ type: 'license', detail: 'hyundaiKia' }]);
        expect(getSgwRequirements(kia, 2024)).toEqual([{ type: 'license', detail: 'hyundaiKia' }]);
        expect(getSgwRequirements(hyundai, 2017)).toEqual([]);
        expect(getSgwRequirements(kia, 2017)).toEqual([]);
    });

    it('Mercedes-Benz Truck 2022 → mercedes licence; 2021 → none', () => {
        expect(getSgwRequirements(mbTruck, 2022)).toEqual([{ type: 'license', detail: 'mercedes' }]);
        expect(getSgwRequirements(mbTruck, 2021)).toEqual([]);
    });

    it('VW group 2020 → vag licence', () => {
        expect(getSgwRequirements(vw, 2020)).toEqual([{ type: 'license', detail: 'vag' }]);
        expect(getSgwRequirements(vw, 2019)).toEqual([]);
    });

    it('BMW 2020 → nothing (no sgw block)', () => {
        expect(getSgwRequirements(bmw, 2020)).toEqual([]);
    });
});

describe('add-on SKU resolution', () => {
    it('getErweiterungSku per vehicle class', () => {
        expect(getErweiterungSku(fiat)).toBe('GG-PRO-EXT-CAR');
        expect(getErweiterungSku(ineos)).toBe('GG-PRO-EXT-CAR-INEOS');
        expect(getErweiterungSku(ktm)).toBe('GG-PRO-EXT-MOTO');
        expect(getErweiterungSku(daf)).toBe('GG-PRO-EXT-TRUCK');
        expect(getErweiterungSku(wabco)).toBe('GG-PRO-EXT-TRUCK');
        expect(getErweiterungSku(krone)).toBeNull();
        expect(getErweiterungSku(truma)).toBe('GG-PRO-TRUMA');
    });

    it('getProAddOnModules returns the Truma module with its cable', () => {
        const modules = getProAddOnModules();

        expect(modules.map((entry) => entry.id)).toEqual(['accessories-truma']);
        expect(modules[0].requiresCableSku).toBe('GG-CABLE-TRUMA');
        expect(modules[0].tiers).toEqual([]);
    });

    it('SKU maps and durations', () => {
        expect(SGW_LICENSE_SKUS).toEqual({
            stellantis: 'GG-SGW-LIC-STELLANTIS',
            mercedes: 'GG-SGW-LIC-MERCEDES',
            vag: 'GG-SGW-LIC-VAG',
            hyundaiKia: 'GG-SGW-LIC-HYUNDAI-KIA',
        });
        expect(SGW_CABLE_SKUS).toEqual({ IVE: 'GG-SGW-CABLE-IVE', FCCA: 'GG-SGW-CABLE-FCCA' });
        expect(SGW_LICENSE_DURATIONS.map((entry) => entry.code)).toEqual(['day', 'week', 'month', 'year']);
        expect(SGW_LICENSE_DURATIONS.map((entry) => entry.label)).toEqual(['1 Tag', '1 Woche', '1 Monat', '1 Jahr']);
        expect(SGW_LICENSE_DURATIONS.map((entry) => entry.labelEn)).toEqual(['1 day', '1 week', '1 month', '1 year']);
    });

    it('skuToProductSlug lowercases and collapses separators', () => {
        expect(skuToProductSlug('GG-SGW-LIC-STELLANTIS')).toBe('gg-sgw-lic-stellantis');
        expect(skuToProductSlug('GG PRO_EXT--CAR ')).toBe('gg-pro-ext-car');
        expect(skuToProductSlug('-GG-')).toBe('gg');
    });
});

describe('extra-brand URL encoding', () => {
    it('round-trips brand + year and brand without year', () => {
        const selections = [
            { brandGroupId: 'cars-vans-fiat-alfa-romeo-lancia', year: 2020 },
            { brandGroupId: 'cars-vans-ford', year: null },
        ];
        const encoded = encodeExtraBrands(selections);

        expect(encoded).toBe('cars-vans-fiat-alfa-romeo-lancia:2020,cars-vans-ford');
        expect(decodeExtraBrands(encoded)).toEqual(selections);
    });

    it('drops empty ids on encode', () => {
        expect(encodeExtraBrands([{ brandGroupId: '', year: 2020 }, { brandGroupId: 'x', year: null }])).toBe('x');
        expect(encodeExtraBrands([])).toBe('');
    });

    it('tolerates junk on decode', () => {
        expect(decodeExtraBrands(null)).toEqual([]);
        expect(decodeExtraBrands(undefined)).toEqual([]);
        expect(decodeExtraBrands('')).toEqual([]);
        expect(decodeExtraBrands(',,:2020,abc:xyz,def:0,ghi:2019:extra')).toEqual([
            { brandGroupId: 'abc', year: null },
            { brandGroupId: 'def', year: null },
            { brandGroupId: 'ghi', year: 2019 },
        ]);
    });
});

describe('ELITE routing', () => {
    it('maps vehicle types to devices; Bus never lands on Truck/Trailer', () => {
        expect(ELITE_DEVICES.map((entry) => [entry.sku, entry.vehicleTypeKeys])).toEqual([
            ['GG-ELITE-CARS-MX', ['car']],
            ['GG-ELITE-CARS-MB', ['car']],
            ['GG-ELITE-MOTO-MB', ['moto']],
            ['GG-ELITE-BUS-MB', ['bus']],
            ['GG-ELITE-TRUCK-MB', ['truck-trailer']],
            ['GG-ELITE-FULL-MB', ['all']],
        ]);
        expect(getEliteDevicesForVehicleType('car').map((entry) => entry.sku)).toEqual(['GG-ELITE-CARS-MX', 'GG-ELITE-CARS-MB']);
        expect(getEliteDevicesForVehicleType('bus').map((entry) => entry.sku)).toEqual(['GG-ELITE-BUS-MB']);
        expect(getEliteDevicesForVehicleType('truck-trailer').map((entry) => entry.sku)).toEqual(['GG-ELITE-TRUCK-MB']);
        expect(getEliteDevicesForVehicleType('all').map((entry) => entry.sku)).toEqual(['GG-ELITE-FULL-MB']);
        expect(getEliteDevicesForVehicleType('unknown')).toEqual([]);
    });

    it('ELITE Cars Mixed constants and eligible brands (all CARS&VANS, sorted)', () => {
        expect(ELITE_MIXED_SKU).toBe('GG-ELITE-CARS-MX');
        expect(ELITE_MIXED_MIN_BRANDS).toBe(4);
        expect(ELITE_MIXED_MAX_BRANDS).toBe(10);

        const eligible = getEliteMixedEligibleBrands();

        expect(eligible.every((entry) => entry.vehicleGroup === 'CARS&VANS')).toBe(true);
        expect(eligible).toHaveLength(ALL_BRAND_GROUPS.filter((entry) => entry.vehicleGroup === 'CARS&VANS').length);
        expect(eligible.map((entry) => entry.id)).toContain('cars-vans-tesla');
        expect(eligible.map((entry) => entry.displayName)).toEqual(
            [...eligible.map((entry) => entry.displayName)].sort((a, b) => a.localeCompare(b, 'de-CH')),
        );
    });
});

describe('formatSelectionBadge / getBrandGroupName', () => {
    it('counts ELITE Mixed brand groups', () => {
        expect(formatSelectionBadge({ selectedBrandGroupIds: 'a,b,c' })).toBe('3 Markengruppen gewählt');
        expect(formatSelectionBadge({ selectedBrandGroupIds: 'a,,b' }, 'en')).toBe('2 brand groups selected');
        expect(formatSelectionBadge({ selectedBrandGroupIds: 'a', selectedBrandGroupId: fiat.id, selectedYear: 2020 })).toBe('1 Markengruppen gewählt');
    });

    it('joins brand name and model year', () => {
        expect(formatSelectionBadge({ selectedBrandGroupId: fiat.id, selectedYear: 2020 })).toBe('Fiat, Alfa Romeo, Lancia · Modelljahr 2020');
        expect(formatSelectionBadge({ selectedBrandGroupId: fiat.id, selectedYear: 2020 }, 'en')).toBe('Fiat, Alfa Romeo, Lancia · Model year 2020');
        expect(formatSelectionBadge({ selectedBrandGroupId: fiat.id })).toBe('Fiat, Alfa Romeo, Lancia');
        expect(formatSelectionBadge({ selectedYear: 2019 })).toBe('Modelljahr 2019');
        expect(formatSelectionBadge({ selectedBrandGroupId: 'does-not-exist', selectedYear: 2019 }, 'en')).toBe('Model year 2019');
        expect(formatSelectionBadge({})).toBeNull();
        expect(formatSelectionBadge({ selectedBrandGroupId: 'does-not-exist' })).toBeNull();
    });

    it('getBrandGroupName', () => {
        expect(getBrandGroupName('cars-vans-ineos')).toBe('INEOS');
        expect(getBrandGroupName('nope')).toBeNull();
        expect(getBrandGroupName(null)).toBeNull();
        expect(getBrandGroupName(undefined)).toBeNull();
    });
});
