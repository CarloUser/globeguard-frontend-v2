import { describe, expect, it } from 'vitest';

import { getProductHighlightItems, getProductHighlights } from '../product-highlights';
import { buildPurchaseQuantityOptions, getPurchaseQuantityRules, sanitizePurchaseQuantity } from '../purchase-quantities';
import { getIncludedVatAmount, VAT_RATE } from '../vat-and-shipping';
import { vehicleTypeFromSku, vehicleTypeIconPath, vehicleTypeLabel } from '../vehicle-type';

describe('vehicleTypeFromSku', () => {
    it('follows the SKU precedence of the previous badge', () => {
        expect(vehicleTypeFromSku('GG-BASIC-WOMO-FIAT-ALFA-ROMEO-LANCIA')).toBe('womo');
        expect(vehicleTypeFromSku('GG-BASIC-WOMO')).toBe('womo');
        expect(vehicleTypeFromSku('GG-PRO-TRUMA')).toBe('womo');
        expect(vehicleTypeFromSku('GG-CABLE-TRUMA')).toBe('womo');
        expect(vehicleTypeFromSku('GG-ELITE-FULL-MB')).toBe('all');
        expect(vehicleTypeFromSku('GG-ELITE-BUS-MB')).toBe('bus');
        expect(vehicleTypeFromSku('GG-BASIC-CAR-FIAT-ALFA-ROMEO-LANCIA')).toBe('car');
        expect(vehicleTypeFromSku('GG-ELITE-CARS-MX')).toBe('car');
        expect(vehicleTypeFromSku('GG-PRO-EXT-CAR-INEOS')).toBe('car');
        expect(vehicleTypeFromSku('GG-PRO-MOTO-KTM')).toBe('moto');
        expect(vehicleTypeFromSku('GG-PRO-EXT-MOTO')).toBe('moto');
        expect(vehicleTypeFromSku('GG-PRO-TRUCK-DAF')).toBe('truck');
        expect(vehicleTypeFromSku('GG-ELITE-TRUCK-MB')).toBe('truck');
        expect(vehicleTypeFromSku('GG-PRO-TRAILER-WABCO')).toBe('trailer');
        expect(vehicleTypeFromSku('GG-PRO-AGRAR-KRONE')).toBe('agrar');
        expect(vehicleTypeFromSku('GG-PRO-INDUSTRIAL-VOLVO-PENTA')).toBe('industrial');
        expect(vehicleTypeFromSku('gg-pro-car-bmw-mini')).toBe('car');
    });

    it('returns null for non-GlobeGuard or unclassified SKUs', () => {
        expect(vehicleTypeFromSku('GG-SGW-LIC-STELLANTIS')).toBeNull();
        expect(vehicleTypeFromSku('GG-SVC-FERN')).toBeNull();
        expect(vehicleTypeFromSku('ABC-CAR')).toBeNull();
        expect(vehicleTypeFromSku('')).toBeNull();
        expect(vehicleTypeFromSku(null)).toBeNull();
        expect(vehicleTypeFromSku(undefined)).toBeNull();
    });

    it('icon path and labels', () => {
        expect(vehicleTypeIconPath('womo')).toBe('/images/vehicle-types/womo.png');
        expect(vehicleTypeLabel('womo')).toBe('Wohnmobil');
        expect(vehicleTypeLabel('womo', 'en')).toBe('Motorhome');
        expect(vehicleTypeLabel('all', 'de-CH')).toBe('Alle Fahrzeugklassen');
    });
});

describe('getProductHighlights', () => {
    it('non-device tiers get no highlights', () => {
        expect(getProductHighlights({ sku: 'GG-SGW-LIC-STELLANTIS', tierKey: 'SGW_LICENSE' })).toEqual([]);
        expect(getProductHighlights({ sku: 'GG-CABLE-TRUMA', tierKey: 'ZUBEHOER' })).toEqual([]);
        expect(getProductHighlights({ sku: 'GG-PRO-EXT-CAR', tierKey: 'PRO_ERWEITERUNG' })).toEqual([]);
    });

    it('BASIC Fiat: 3 brand bullets lead, DPF generic dropped as overlapping, capped at 7', () => {
        const items = getProductHighlightItems({
            sku: 'GG-BASIC-CAR-FIAT-ALFA-ROMEO-LANCIA',
            tierKey: 'BASIC',
            brandGroupId: 'cars-vans-fiat-alfa-romeo-lancia',
        });

        expect(items.slice(0, 3).map((item) => item.key)).toEqual([
            'brand:cars-vans-fiat-alfa-romeo-lancia:0',
            'brand:cars-vans-fiat-alfa-romeo-lancia:1',
            'brand:cars-vans-fiat-alfa-romeo-lancia:2',
        ]);
        expect(items[0].text).toBe('Service- und Ölwechsel-Reset');
        expect(items.map((item) => item.key)).toEqual([
            'brand:cars-vans-fiat-alfa-romeo-lancia:0',
            'brand:cars-vans-fiat-alfa-romeo-lancia:1',
            'brand:cars-vans-fiat-alfa-romeo-lancia:2',
            'readClearAll',
            'injectorCoding',
            'liveData',
            'remoteDiagnostics',
        ]);
        expect(items).toHaveLength(7);
    });

    it('Tesla (evOnly) never sees DPF/injector bullets; English locale', () => {
        const texts = getProductHighlights({ sku: 'GG-PRO-CAR-TESLA', tierKey: 'PRO', brandGroupId: 'cars-vans-tesla' }, 'en');

        expect(texts.join('\n')).not.toMatch(/DPF|injector/i);
        expect(texts).toContain('Coding & calibration of sensors and intelligent components');
    });

    it('moto → ABS bullet, no DPF; WoMo → Truma bullet; ELITE Full → all-classes bullet', () => {
        const motoKeys = getProductHighlightItems({ sku: 'GG-PRO-MOTO-KTM', tierKey: 'PRO' }).map((item) => item.key);
        const womoKeys = getProductHighlightItems({ sku: 'GG-BASIC-WOMO-FORD', tierKey: 'WOMO' }).map((item) => item.key);
        const fullKeys = getProductHighlightItems({ sku: 'GG-ELITE-FULL-MB', tierKey: 'ELITE_FULL' }).map((item) => item.key);

        expect(motoKeys).toEqual(['readClearAll', 'absMaintenance', 'injectorCoding', 'liveData', 'remoteDiagnostics']);
        expect(womoKeys).toEqual(['readClearAll', 'dpfAdblue', 'trumaUnlock', 'injectorCoding', 'liveData', 'remoteDiagnostics']);
        expect(fullKeys).toEqual(['readClearAll', 'allClasses', 'dpfAdblue', 'injectorCoding', 'liveData', 'remoteDiagnostics']);
    });
});

describe('purchase quantities', () => {
    it('rules default to 1/1/1 and sanitize to the step grid', () => {
        expect(getPurchaseQuantityRules(null)).toEqual({ minQty: 1, quantityStep: 1, defaultQty: 1 });
        expect(getPurchaseQuantityRules({ minQty: 2, quantityStep: 3, defaultQty: 4 })).toEqual({ minQty: 2, quantityStep: 3, defaultQty: 5 });

        const rules = { minQty: 2, quantityStep: 3, defaultQty: 5 };

        expect(sanitizePurchaseQuantity('abc', rules)).toBe(5);
        expect(sanitizePurchaseQuantity(0, rules)).toBe(2);
        expect(sanitizePurchaseQuantity(3, rules)).toBe(5);
        expect(sanitizePurchaseQuantity('8', rules)).toBe(8);
        expect(buildPurchaseQuantityOptions(rules, 4)).toEqual([2, 5, 8, 11]);
        expect(buildPurchaseQuantityOptions({ minQty: 1, quantityStep: 1, defaultQty: 1 }, 0)).toEqual([1]);
    });
});

describe('vat-and-shipping', () => {
    it('extracts the included Swiss VAT', () => {
        expect(VAT_RATE).toBe(0.081);
        expect(getIncludedVatAmount(10810)).toBe(810);
        expect(getIncludedVatAmount(10000, 0.25)).toBe(2000);
    });
});
