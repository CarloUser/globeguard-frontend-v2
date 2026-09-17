import { describe, expect, it } from 'vitest';

import {
    AddOnPlanInput,
    BLOCKING_WARNINGS,
    buildAddOnPlan,
    buildCartLines,
    CONFIRM_WARNINGS,
    ConfiguratorSelections,
    DEFAULT_SELECTIONS,
    findVariantByOptionCode,
    getExtensionBrandOptions,
    getFixedExtensionGroupId,
    getRequiredAddOnSkus,
    getVariantDurationCode,
    isPlanBlocked,
    LICENSE_PRODUCT_SKUS,
    resolveExtensionBrandGroupId,
    toggleEliteMixedBrand,
    TRUMA_CABLE_SKU,
} from '../add-on-plan';
import { decodeExtraBrands, ELITE_MIXED_MAX_BRANDS } from '../picker';
import type { CatalogProduct, CatalogVariant } from '../types';
import {
    ALL_ADD_ON_PRODUCTS,
    basicFiat,
    basicIveco,
    basicMercedes,
    cableTruma,
    eliteCarsMb,
    eliteCarsMx,
    licenseProduct,
    licStellantis,
    licVag,
    proBmw,
    proExtCar,
    proExtCarIneos,
    proExtMoto,
    proExtTruck,
    proFiat,
    proTruma,
    sgwCableFcca,
    sgwCableIve,
    simpleProduct,
    svcFern,
    variantId,
    womoFiat,
} from './fixtures';

const FIAT = 'cars-vans-fiat-alfa-romeo-lancia';
const VW = 'cars-vans-vw-gruppe-audi-cupra-seat-skoda-volkswagen';
const INEOS = 'cars-vans-ineos';
const TRUMA = 'accessories-truma';
const BMW = 'cars-vans-bmw-mini';
const BMW_MOTORRAD = 'bike-bmw-motorrad';

type PlanOverrides = Partial<Omit<AddOnPlanInput, 'selections'>> & { selections?: Partial<ConfiguratorSelections> };

function plan(product: CatalogProduct, overrides: PlanOverrides = {}) {
    const { selections, ...rest } = overrides;

    return buildAddOnPlan({
        product,
        selectedVariant: product.variants[0],
        urlYear: null,
        extraBrands: [],
        addOnProducts: ALL_ADD_ON_PRODUCTS,
        ...rest,
        selections: { ...DEFAULT_SELECTIONS, ...selections },
    });
}

function summary(result: ReturnType<typeof buildAddOnPlan>) {
    return result.lines.map((line) => [line.sku, line.quantity, line.customFields?.selectedBrandGroupId, line.customFields?.selectedYear]);
}

describe('BASIC device with main-brand SGW', () => {
    it('Fiat 2020 → bypass cable then Stellantis licence, both with customFields', () => {
        const result = plan(basicFiat, { urlYear: 2020 });

        expect(result.lines).toEqual([
            {
                sku: 'GG-SGW-CABLE-FCCA',
                label: 'SGW-Bypass-Kabel (FCCA)',
                labelEn: 'SGW bypass cable (FCCA)',
                labelKey: 'sgwCable',
                labelParams: { cable: 'FCCA' },
                variantId: variantId(sgwCableFcca),
                quantity: 1,
                priceNet: 9000,
                customFields: { selectedBrandGroupId: FIAT, selectedYear: 2020 },
                kind: 'sgw-cable',
            },
            {
                sku: 'GG-SGW-LIC-STELLANTIS',
                label: 'SGW-Lizenz Fiat/Stellantis (1 Tag)',
                labelEn: 'SGW license Fiat/Stellantis (1 day)',
                labelKey: 'sgwLicense',
                labelParams: { licenseGroup: 'stellantis', duration: 'day', quantity: 1 },
                variantId: variantId(licStellantis, 'day'),
                quantity: 1,
                priceNet: 2000,
                customFields: { selectedBrandGroupId: FIAT, selectedYear: 2020 },
                kind: 'sgw-license',
            },
        ]);
        expect(result.warnings).toEqual([]);
        expect(result.totalAddOnsNet).toBe(11000);
        expect(result.deviceTotalNet).toBe(62000);
        expect(result.liveTotalNet).toBe(73000);
        expect(result.yearFits).toBe(true);
        expect(result.mainSgwRequirements).toEqual([
            { type: 'bypass-cable', detail: 'FCCA' },
            { type: 'license', detail: 'stellantis' },
        ]);
        expect(result.brandGroup?.id).toBe(FIAT);
        expect(result.flags).toEqual({
            isEliteDevice: false,
            isEliteMixed: false,
            isWomo: false,
            isTrumaExtension: false,
            isIneosExtension: false,
            isStandaloneExtension: false,
            isStandaloneLicense: false,
            hasConfigurator: true,
        });
    });

    it('licence quantity and duration select: 3 × month → "3× …" label, month variant', () => {
        const result = plan(basicFiat, { urlYear: 2021, selections: { sgwDuration: 'month', sgwQuantity: 3 } });

        expect(result.lines).toHaveLength(1);
        expect(result.lines[0]).toMatchObject({
            sku: 'GG-SGW-LIC-STELLANTIS',
            label: '3× SGW-Lizenz Fiat/Stellantis (1 Monat)',
            labelEn: '3× SGW license Fiat/Stellantis (1 month)',
            labelParams: { licenseGroup: 'stellantis', duration: 'month', quantity: 3 },
            variantId: variantId(licStellantis, 'month'),
            quantity: 3,
            priceNet: 9000,
        });
        expect(result.totalAddOnsNet).toBe(27000);
        expect(result.liveTotalNet).toBe(62000 + 27000);
    });

    it('licence quantity is clamped to 1..20 before device scaling (0, NaN, -2 → 1; 25 → 20)', () => {
        const licenceLine = (sgwQuantity: number, deviceQuantity = 1) => {
            const result = plan(basicFiat, { urlYear: 2021, deviceQuantity, selections: { sgwQuantity } });

            expect(result.lines).toHaveLength(1);
            expect(result.lines[0].sku).toBe('GG-SGW-LIC-STELLANTIS');

            return result.lines[0];
        };

        expect(licenceLine(0)).toMatchObject({ quantity: 1, label: 'SGW-Lizenz Fiat/Stellantis (1 Tag)', labelParams: { quantity: 1 } });
        expect(licenceLine(Number.NaN)).toMatchObject({ quantity: 1, label: 'SGW-Lizenz Fiat/Stellantis (1 Tag)', labelParams: { quantity: 1 } });
        expect(licenceLine(-2)).toMatchObject({ quantity: 1, label: 'SGW-Lizenz Fiat/Stellantis (1 Tag)', labelParams: { quantity: 1 } });
        expect(licenceLine(25)).toMatchObject({ quantity: 20, label: '20× SGW-Lizenz Fiat/Stellantis (1 Tag)', labelParams: { quantity: 20 } });
        expect(licenceLine(2.9)).toMatchObject({ quantity: 2, label: '2× SGW-Lizenz Fiat/Stellantis (1 Tag)' });
        expect(plan(basicFiat, { urlYear: 2021, selections: { sgwQuantity: 25 } }).totalAddOnsNet).toBe(20 * 2000);

        // Clamped first, then scaled by the device quantity.
        expect(licenceLine(25, 2)).toMatchObject({ quantity: 40, label: '40× SGW-Lizenz Fiat/Stellantis (1 Tag)', labelParams: { quantity: 40 } });
        expect(licenceLine(0, 3)).toMatchObject({ quantity: 3, label: '3× SGW-Lizenz Fiat/Stellantis (1 Tag)', labelParams: { quantity: 3 } });
    });

    it('Iveco 2019 → IVE cable only; Mercedes 2021 → mercedes licence only', () => {
        expect(summary(plan(basicIveco, { urlYear: 2019 }))).toEqual([['GG-SGW-CABLE-IVE', 1, 'cars-vans-iveco-daily', 2019]]);
        expect(plan(basicIveco, { urlYear: 2019 }).lines[0].variantId).toBe(variantId(sgwCableIve));
        expect(summary(plan(basicMercedes, { urlYear: 2021 }))).toEqual([['GG-SGW-LIC-MERCEDES', 1, 'cars-vans-mercedes-benz-pkw-van', 2021]]);
    });

    it('no year or no requirement → no lines, no warning', () => {
        expect(plan(basicFiat).lines).toEqual([]);
        expect(plan(basicFiat).warnings).toEqual([]);
        expect(plan(basicFiat, { urlYear: 2015 }).lines).toEqual([]);
        expect(plan(proBmw, { urlYear: 2020 }).lines).toEqual([]);
        expect(plan(proBmw, { urlYear: 2020 }).mainSgwRequirements).toEqual([]);
    });

    it('unticked SGW → no lines + "sgw-unticked" warning (not blocking)', () => {
        const result = plan(basicFiat, { urlYear: 2020, selections: { sgwSelected: false } });

        expect(result.lines).toEqual([]);
        expect(result.warnings).toEqual(['sgw-unticked']);
        expect(isPlanBlocked(result)).toBe(false);
        expect(result.liveTotalNet).toBe(62000);
        // No requirement → unticking is meaningless, no warning.
        expect(plan(basicFiat, { urlYear: 2015, selections: { sgwSelected: false } }).warnings).toEqual([]);
    });

    it('year compatibility against the selected variant window', () => {
        expect(plan(basicFiat, { urlYear: 2005 }).yearFits).toBe(false);
        expect(plan(basicFiat, { urlYear: 2008 }).yearFits).toBe(true);
        expect(plan(basicFiat).yearFits).toBeNull();

        const windowed: CatalogVariant = { ...basicFiat.variants[0], compatibleFromYear: 2008, compatibleToYear: 2015 };

        expect(plan(basicFiat, { urlYear: 2016, selectedVariant: windowed }).yearFits).toBe(false);
        expect(plan(basicFiat, { urlYear: 2015, selectedVariant: windowed }).yearFits).toBe(true);

        const open: CatalogVariant = { ...basicFiat.variants[0], compatibleFromYear: null, compatibleToYear: null };

        expect(plan(basicFiat, { urlYear: 1990, selectedVariant: open }).yearFits).toBeNull();
    });
});

describe('PRO device with extra brands', () => {
    it('two extra brands incl. INEOS → Erweiterung SKUs + per-brand SGW using the main duration', () => {
        const result = plan(proFiat, {
            urlYear: 2020,
            extraBrands: decodeExtraBrands(`${VW}:2021,${INEOS}:2023`),
            selections: { sgwDuration: 'week' },
        });

        expect(summary(result)).toEqual([
            ['GG-SGW-CABLE-FCCA', 1, FIAT, 2020],
            ['GG-SGW-LIC-STELLANTIS', 1, FIAT, 2020],
            ['GG-PRO-EXT-CAR', 1, VW, 2021],
            ['GG-SGW-LIC-VAG', 1, VW, 2021],
            ['GG-PRO-EXT-CAR-INEOS', 1, INEOS, 2023],
        ]);
        expect(result.lines[1].variantId).toBe(variantId(licStellantis, 'week'));
        expect(result.lines[3].variantId).toBe(variantId(licVag, 'week'));
        expect(result.lines[3].label).toBe('SGW-Lizenz VW-Gruppe (1 Woche)');
        expect(result.lines[2]).toMatchObject({
            label: 'PRO Erweiterung – VW Gruppe (Audi; Cupra, Seat, Skoda, Volkswagen)',
            labelEn: 'PRO Extension – VW Gruppe (Audi; Cupra, Seat, Skoda, Volkswagen)',
            labelKey: 'proExtension',
            kind: 'erweiterung',
            priceNet: 32000,
            variantId: variantId(proExtCar),
        });
        expect(result.lines[4]).toMatchObject({
            label: 'PRO Erweiterung – INEOS',
            priceNet: 38000,
            variantId: variantId(proExtCarIneos),
        });
        expect(result.totalAddOnsNet).toBe(9000 + 5000 + 32000 + 5000 + 38000);
        expect(result.liveTotalNet).toBe(82000 + result.totalAddOnsNet);
        expect(result.extraBrandRows.map((row) => [row.brand.id, row.isModule, row.requirements.length, row.sgwSelected])).toEqual([
            [VW, false, 1, true],
            [INEOS, false, 0, true],
        ]);
    });

    it('extra brand without year → Erweiterung line only (selectedYear undefined), no SGW', () => {
        const result = plan(proBmw, { urlYear: 2015, extraBrands: decodeExtraBrands(FIAT) });

        expect(result.lines).toHaveLength(1);
        expect(result.lines[0]).toMatchObject({
            sku: 'GG-PRO-EXT-CAR',
            customFields: { selectedBrandGroupId: FIAT, selectedYear: undefined },
        });
        expect(result.extraBrandRows[0].requirements).toEqual([]);
    });

    it('extra-brand SGW tick defaults to true and can be unticked per brand', () => {
        const extraBrands = decodeExtraBrands(`${VW}:2021,${FIAT}:2019`);
        const ticked = plan(proBmw, { urlYear: 2015, extraBrands });
        const unticked = plan(proBmw, { urlYear: 2015, extraBrands, selections: { extraSgwSelected: { [VW]: false } } });

        expect(summary(ticked)).toEqual([
            ['GG-PRO-EXT-CAR', 1, VW, 2021],
            ['GG-SGW-LIC-VAG', 1, VW, 2021],
            ['GG-PRO-EXT-CAR', 1, FIAT, 2019],
            ['GG-SGW-CABLE-FCCA', 1, FIAT, 2019],
        ]);
        expect(summary(unticked)).toEqual([
            ['GG-PRO-EXT-CAR', 1, VW, 2021],
            ['GG-PRO-EXT-CAR', 1, FIAT, 2019],
            ['GG-SGW-CABLE-FCCA', 1, FIAT, 2019],
        ]);
        expect(unticked.extraBrandRows.map((row) => row.sgwSelected)).toEqual([false, true]);
        expect(unticked.warnings).toEqual([]);
    });

    it('unknown extra brand ids are dropped; AGRAR brands have no Erweiterung product', () => {
        expect(plan(proBmw, { extraBrands: decodeExtraBrands('nope:2020') }).lines).toEqual([]);
        expect(plan(proBmw, { extraBrands: decodeExtraBrands('nope:2020') }).extraBrandRows).toEqual([]);
        expect(plan(proBmw, { extraBrands: decodeExtraBrands('agrar-krone:2020') }).lines).toEqual([]);
        expect(plan(proBmw, { extraBrands: decodeExtraBrands('agrar-krone:2020') }).extraBrandRows).toHaveLength(1);
    });

    it('Truma module slot → GG-PRO-TRUMA + GG-CABLE-TRUMA with customFields', () => {
        const result = plan(proBmw, { urlYear: 2015, extraBrands: decodeExtraBrands(TRUMA) });

        expect(result.lines).toEqual([
            {
                sku: 'GG-PRO-TRUMA',
                label: 'PRO Erweiterung – Truma',
                labelEn: 'PRO Extension – Truma',
                labelKey: 'proExtensionModule',
                labelParams: { name: 'Truma', brandGroupId: TRUMA },
                variantId: variantId(proTruma),
                quantity: 1,
                priceNet: 32000,
                customFields: { selectedBrandGroupId: TRUMA, selectedYear: undefined },
                kind: 'erweiterung',
            },
            {
                sku: 'GG-CABLE-TRUMA',
                label: 'Adapterkabel-Set Truma',
                labelEn: 'Adapter cable set Truma',
                labelKey: 'cableSet',
                labelParams: { name: 'Truma', brandGroupId: TRUMA },
                variantId: variantId(cableTruma),
                quantity: 1,
                priceNet: 9000,
                customFields: { selectedBrandGroupId: TRUMA },
                kind: 'truma-cable',
            },
        ]);
        expect(result.extraBrandRows[0].isModule).toBe(true);
        expect(result.warnings).toEqual([]);
    });

    it('Truma module slot with the cable unticked → module line only (no warning, as before)', () => {
        const result = plan(proBmw, { extraBrands: decodeExtraBrands(TRUMA), selections: { trumaCableSelected: false } });

        expect(summary(result)).toEqual([['GG-PRO-TRUMA', 1, TRUMA, undefined]]);
        expect(result.warnings).toEqual([]);
    });

    it('dedupes SGW lines on (sku, selectedBrandGroupId) — extra brand equal to the main brand', () => {
        const result = plan(proFiat, { urlYear: 2020, extraBrands: decodeExtraBrands(`${FIAT}:2020`) });

        expect(summary(result)).toEqual([
            ['GG-SGW-CABLE-FCCA', 1, FIAT, 2020],
            ['GG-SGW-LIC-STELLANTIS', 1, FIAT, 2020],
            ['GG-PRO-EXT-CAR', 1, FIAT, 2020],
        ]);
    });

    it('dedupes SGW lines for a duplicated extra brand (the Erweiterung line itself is not deduped)', () => {
        const result = plan(proBmw, { extraBrands: decodeExtraBrands(`${VW}:2021,${VW}:2021`) });

        expect(summary(result)).toEqual([
            ['GG-PRO-EXT-CAR', 1, VW, 2021],
            ['GG-SGW-LIC-VAG', 1, VW, 2021],
            ['GG-PRO-EXT-CAR', 1, VW, 2021],
        ]);
    });

    it('the same SGW SKU for two different brands is kept twice', () => {
        const result = plan(proBmw, { extraBrands: decodeExtraBrands('cars-vans-bentley:2021,cars-vans-bugatti:2021') });

        expect(summary(result)).toEqual([
            ['GG-PRO-EXT-CAR', 1, 'cars-vans-bentley', 2021],
            ['GG-SGW-LIC-VAG', 1, 'cars-vans-bentley', 2021],
            ['GG-PRO-EXT-CAR', 1, 'cars-vans-bugatti', 2021],
            ['GG-SGW-LIC-VAG', 1, 'cars-vans-bugatti', 2021],
        ]);
    });
});

describe('WoMo device and Truma extension', () => {
    it('WoMo → Truma cable line without customFields, after the SGW lines', () => {
        const result = plan(womoFiat, { urlYear: 2020 });

        expect(summary(result)).toEqual([
            ['GG-SGW-CABLE-FCCA', 1, FIAT, 2020],
            ['GG-SGW-LIC-STELLANTIS', 1, FIAT, 2020],
            ['GG-CABLE-TRUMA', 1, undefined, undefined],
        ]);
        expect(result.lines[2]).toEqual({
            sku: 'GG-CABLE-TRUMA',
            label: 'Adapterkabel-Set Truma Combi',
            labelEn: 'Adapter cable set Truma Combi',
            labelKey: 'trumaCable',
            labelParams: {},
            variantId: variantId(cableTruma),
            quantity: 1,
            priceNet: 9000,
            customFields: undefined,
            kind: 'truma-cable',
        });
        expect(result.flags.isWomo).toBe(true);
        expect(result.liveTotalNet).toBe(84800 + 9000 + 2000 + 9000);
    });

    it('WoMo with the cable unticked → warning, no cable line', () => {
        const result = plan(womoFiat, { selections: { trumaCableSelected: false } });

        expect(result.lines).toEqual([]);
        expect(result.warnings).toEqual(['truma-cable-unticked']);
        expect(isPlanBlocked(result)).toBe(false);
    });

    it('standalone Truma extension → fixed brand group + Truma cable line', () => {
        const result = plan(proTruma);

        expect(summary(result)).toEqual([['GG-CABLE-TRUMA', 1, undefined, undefined]]);
        expect(result.flags.isTrumaExtension).toBe(true);
        expect(result.flags.isStandaloneExtension).toBe(true);
        expect(result.extensionBrandGroupId).toBe(TRUMA);
        expect(result.warnings).toEqual([]);
        expect(getFixedExtensionGroupId(proTruma)).toBe(TRUMA);
        expect(getExtensionBrandOptions(proTruma)).toEqual([]);
    });
});

describe('standalone PRO Erweiterung products', () => {
    it('GG-PRO-EXT-CAR needs a brand group; blocked until chosen', () => {
        const missing = plan(proExtCar);

        expect(missing.warnings).toEqual(['extension-brand-missing']);
        expect(isPlanBlocked(missing)).toBe(true);
        expect(missing.extensionBrandGroupId).toBeNull();
        expect(missing.lines).toEqual([]);
        expect(missing.flags.hasConfigurator).toBe(true);

        const chosen = plan(proExtCar, { selections: { extensionBrandGroupId: BMW } });

        expect(chosen.warnings).toEqual([]);
        expect(chosen.extensionBrandGroupId).toBe(BMW);
        expect(buildCartLines(proExtCar, proExtCar.variants[0], 1, chosen)).toEqual([
            {
                productVariantId: variantId(proExtCar),
                quantity: 1,
                customFields: { selectedBrandGroupId: BMW, selectedYear: undefined, selectedBrandGroupIds: undefined },
            },
        ]);
    });

    it('dropdown options per extension product', () => {
        const car = getExtensionBrandOptions(proExtCar);

        expect(car.every((group) => group.vehicleGroup === 'CARS&VANS')).toBe(true);
        expect(car.map((group) => group.id)).not.toContain(INEOS);
        expect(car.map((group) => group.displayName)).toEqual(
            [...car.map((group) => group.displayName)].sort((a, b) => a.localeCompare(b, 'de-CH')),
        );
        expect(getExtensionBrandOptions(proExtMoto).every((group) => group.vehicleGroup === 'BIKE')).toBe(true);
        expect(getExtensionBrandOptions(proExtMoto)).toHaveLength(13);
        expect(getExtensionBrandOptions(proExtTruck).map((group) => group.vehicleGroup)).toEqual(expect.arrayContaining(['TRUCK&BUS', 'TRAILER']));
        expect(getExtensionBrandOptions(proExtTruck)).toHaveLength(12);
        expect(getExtensionBrandOptions(proExtCarIneos)).toEqual([]);
        expect(getExtensionBrandOptions(proBmw)).toEqual([]);
    });

    it('GG-PRO-EXT-MOTO accepts only its own dropdown ids: a CARS&VANS id or an unknown id blocks like "nothing chosen"', () => {
        const carsId = plan(proExtMoto, { selections: { extensionBrandGroupId: BMW } });
        const unknownId = plan(proExtMoto, { selections: { extensionBrandGroupId: 'does-not-exist' } });

        [carsId, unknownId].forEach((result) => {
            expect(result.warnings).toEqual(['extension-brand-missing']);
            expect(isPlanBlocked(result)).toBe(true);
            expect(result.extensionBrandGroupId).toBeNull();
            expect(result.lines).toEqual([]);
            expect(buildCartLines(proExtMoto, proExtMoto.variants[0], 1, result)).toEqual([
                {
                    productVariantId: variantId(proExtMoto),
                    quantity: 1,
                    customFields: { selectedBrandGroupId: undefined, selectedYear: undefined, selectedBrandGroupIds: undefined },
                },
            ]);
        });

        const bike = plan(proExtMoto, { selections: { extensionBrandGroupId: BMW_MOTORRAD } });

        expect(getExtensionBrandOptions(proExtMoto).map((group) => group.id)).toContain(BMW_MOTORRAD);
        expect(bike.warnings).toEqual([]);
        expect(bike.extensionBrandGroupId).toBe(BMW_MOTORRAD);
        expect(buildCartLines(proExtMoto, proExtMoto.variants[0], 1, bike)[0].customFields).toMatchObject({ selectedBrandGroupId: BMW_MOTORRAD });

        // INEOS has its own extension product, so its id is not a valid GG-PRO-EXT-CAR dropdown choice either.
        expect(plan(proExtCar, { selections: { extensionBrandGroupId: INEOS } }).warnings).toEqual(['extension-brand-missing']);
        expect(resolveExtensionBrandGroupId(proExtCar, 'does-not-exist')).toBe('');
        expect(resolveExtensionBrandGroupId(proExtCar, BMW)).toBe(BMW);
        // Non-extension products never carry an extension brand group.
        expect(resolveExtensionBrandGroupId(proBmw, BMW)).toBe('');
    });

    it('INEOS extension is fixed to the INEOS group and ignores the dropdown value', () => {
        const result = plan(proExtCarIneos, { selections: { extensionBrandGroupId: BMW } });

        expect(result.extensionBrandGroupId).toBe(INEOS);
        expect(result.flags.isIneosExtension).toBe(true);
        expect(result.warnings).toEqual([]);
        expect(getFixedExtensionGroupId(proExtCarIneos)).toBe(INEOS);
        expect(getFixedExtensionGroupId(proExtCar)).toBe('');
    });
});

describe('ELITE Cars Mixed', () => {
    const four = ['cars-vans-bmw-mini', 'cars-vans-ford', 'cars-vans-tesla', INEOS];

    it('3 brands invalid (blocked), 4 valid, 11 invalid', () => {
        const three = plan(eliteCarsMx, { selections: { eliteMixedBrandIds: four.slice(0, 3) } });

        expect(three.flags.isEliteMixed).toBe(true);
        expect(three.flags.isEliteDevice).toBe(false);
        expect(three.warnings).toEqual(['elite-mixed-invalid']);
        expect(isPlanBlocked(three)).toBe(true);
        expect(three.lines).toEqual([]);
        // The ids are carried as chosen; the blocking warning is what keeps them out of the cart.
        expect(three.eliteMixedBrandIds).toEqual(four.slice(0, 3));

        const valid = plan(eliteCarsMx, { selections: { eliteMixedBrandIds: four } });

        expect(valid.warnings).toEqual([]);
        expect(isPlanBlocked(valid)).toBe(false);

        const eleven = plan(eliteCarsMx, { selections: { eliteMixedBrandIds: Array.from({ length: 11 }, (_, index) => `b${index}`) } });

        expect(eleven.warnings).toEqual(['elite-mixed-invalid']);
    });

    it('toggleEliteMixedBrand adds, removes and ignores the 11th', () => {
        let ids: string[] = [];

        for (let index = 0; index < ELITE_MIXED_MAX_BRANDS; index += 1) {
            ids = toggleEliteMixedBrand(ids, `b${index}`);
        }

        expect(ids).toHaveLength(10);
        expect(toggleEliteMixedBrand(ids, 'b10')).toBe(ids);
        expect(toggleEliteMixedBrand(ids, 'b3')).toEqual(ids.filter((id) => id !== 'b3'));
        expect(toggleEliteMixedBrand([], 'x')).toEqual(['x']);
    });

    it('base cart line carries the comma-joined brand ids (from the plan) and no year', () => {
        const selections = { ...DEFAULT_SELECTIONS, eliteMixedBrandIds: four };
        const result = plan(eliteCarsMx, { selections });

        expect(result.eliteMixedBrandIds).toEqual(four);
        expect(result.eliteMixedBrandIds).not.toBe(four); // copied, not aliased to the UI state
        expect(buildCartLines(eliteCarsMx, eliteCarsMx.variants[0], 1, result)).toEqual([
            {
                productVariantId: variantId(eliteCarsMx),
                quantity: 1,
                customFields: { selectedBrandGroupId: undefined, selectedYear: undefined, selectedBrandGroupIds: four.join(',') },
            },
        ]);
        // Not a Mixed product → ids are ignored even if present in the selections.
        expect(plan(proBmw, { selections }).eliteMixedBrandIds).toBeNull();
        expect(buildCartLines(proBmw, proBmw.variants[0], 1, plan(proBmw, { selections }))[0].customFields).toEqual({
            selectedBrandGroupId: BMW,
            selectedYear: undefined,
            selectedBrandGroupIds: undefined,
        });
    });
});

describe('ELITE free SGW multi-select', () => {
    it('nothing ticked → no lines + "elite-no-sgw" (confirm, not block)', () => {
        const result = plan(eliteCarsMb);

        expect(result.flags.isEliteDevice).toBe(true);
        expect(result.lines).toEqual([]);
        expect(result.warnings).toEqual(['elite-no-sgw']);
        expect(isPlanBlocked(result)).toBe(false);
        expect(CONFIRM_WARNINGS).toContain('elite-no-sgw');
        expect(BLOCKING_WARNINGS).not.toContain('elite-no-sgw');
        expect(result.flags.hasConfigurator).toBe(true);
    });

    it('licences (own duration each, qty 1) then cables, all without customFields', () => {
        const result = plan(eliteCarsMb, {
            selections: {
                sgwDuration: 'month',
                sgwQuantity: 5,
                eliteSgw: {
                    licenses: {
                        vag: { selected: true, duration: 'day' },
                        stellantis: { selected: true, duration: 'year' },
                        mercedes: { selected: false, duration: 'week' },
                    },
                    cables: { IVE: true, FCCA: false },
                },
            },
        });

        expect(summary(result)).toEqual([
            ['GG-SGW-LIC-STELLANTIS', 1, undefined, undefined],
            ['GG-SGW-LIC-VAG', 1, undefined, undefined],
            ['GG-SGW-CABLE-IVE', 1, undefined, undefined],
        ]);
        expect(result.lines.every((line) => line.customFields === undefined)).toBe(true);
        expect(result.lines[0]).toMatchObject({ variantId: variantId(licStellantis, 'year'), label: 'SGW-Lizenz Fiat/Stellantis (1 Jahr)', priceNet: 37000 });
        expect(result.lines[1]).toMatchObject({ variantId: variantId(licVag, 'day'), priceNet: 2000 });
        expect(result.lines[2]).toMatchObject({ label: 'SGW-Bypass-Kabel (IVE)', labelEn: 'SGW bypass cable (IVE)' });
        expect(result.warnings).toEqual([]);
        expect(result.totalAddOnsNet).toBe(37000 + 2000 + 9000);
        expect(result.liveTotalNet).toBe(423000 + 48000);
    });

    it('a ticked cable alone clears the warning', () => {
        const result = plan(eliteCarsMb, { selections: { eliteSgw: { licenses: {}, cables: { FCCA: true } } } });

        expect(summary(result)).toEqual([['GG-SGW-CABLE-FCCA', 1, undefined, undefined]]);
        expect(result.warnings).toEqual([]);
    });

    it('base cart line for an ELITE device has no selections', () => {
        const result = plan(eliteCarsMb, { selections: { eliteSgw: { licenses: { mercedes: { selected: true, duration: 'week' } }, cables: {} } } });

        expect(result.eliteMixedBrandIds).toBeNull();
        expect(buildCartLines(eliteCarsMb, eliteCarsMb.variants[0], 1, result)).toEqual([
            { productVariantId: variantId(eliteCarsMb), quantity: 1, customFields: { selectedBrandGroupId: undefined, selectedYear: undefined, selectedBrandGroupIds: undefined } },
            { productVariantId: variantId(ALL_ADD_ON_PRODUCTS['GG-SGW-LIC-MERCEDES'], 'week'), quantity: 1, customFields: undefined },
        ]);
    });
});

describe('standalone licence products', () => {
    it('duration follows the selected variant; no add-on lines', () => {
        const month = licStellantis.variants.find((variant) => variant.sku.endsWith('-MONTH'))!;
        const result = plan(licStellantis, { selectedVariant: month });

        expect(LICENSE_PRODUCT_SKUS).toEqual(['GG-SGW-LIC-STELLANTIS', 'GG-SGW-LIC-MERCEDES', 'GG-SGW-LIC-VAG', 'GG-SVC-FERN']);
        expect(result.flags.isStandaloneLicense).toBe(true);
        expect(result.selectedVariantDuration).toBe('month');
        expect(result.lines).toEqual([]);
        expect(result.warnings).toEqual([]);
        expect(result.liveTotalNet).toBe(9000);
        expect(result.flags.hasConfigurator).toBe(true);
        expect(plan(svcFern, { selectedVariant: svcFern.variants[3] }).selectedVariantDuration).toBe('year');
        expect(plan(svcFern).flags.isStandaloneLicense).toBe(true);
        expect(plan(basicFiat).selectedVariantDuration).toBeNull();
    });

    it('detects the licence product by slug when the sku is a variant sku', () => {
        const bySlug: CatalogProduct = { ...licVag, sku: 'GG-SGW-LIC-VAG-DAY' };

        expect(plan(bySlug).flags.isStandaloneLicense).toBe(true);
    });
});

describe('duration variant matching', () => {
    it('matches option code exactly, by "-<code>" suffix, or by SKU suffix; falls back to variants[0]', () => {
        expect(findVariantByOptionCode(licStellantis.variants, 'year')?.sku).toBe('GG-SGW-LIC-STELLANTIS-YEAR');

        const exact = licenseProduct('GG-X', 'X');
        exact.variants.forEach((variant) => { variant.options = [{ groupCode: 'duration', code: variant.sku.split('-').pop()!.toLowerCase(), name: '' }]; variant.sku = `X-${variant.id}`; });
        expect(findVariantByOptionCode(exact.variants, 'week')?.id).toBe('v-gg-x-week');

        const skuOnly = licenseProduct('GG-Y', 'Y');
        skuOnly.variants.forEach((variant) => { variant.options = []; });
        expect(findVariantByOptionCode(skuOnly.variants, 'month')?.sku).toBe('GG-Y-MONTH');

        expect(findVariantByOptionCode(licStellantis.variants, 'decade')).toBeNull();
        expect(findVariantByOptionCode(undefined, 'day')).toBeNull();
        expect(getVariantDurationCode(skuOnly.variants[2])).toBe('month');
        expect(getVariantDurationCode(basicFiat.variants[0])).toBeNull();
        expect(getVariantDurationCode(null)).toBeNull();
    });

    it('unknown duration → first variant of the licence product', () => {
        const result = plan(basicFiat, { urlYear: 2021, selections: { sgwDuration: 'decade' as never } });

        expect(result.lines[0].variantId).toBe(variantId(licStellantis, 'day'));
        expect(result.lines[0].label).toBe('SGW-Lizenz Fiat/Stellantis (decade)');
    });
});

describe('device quantity scaling (decision B1)', () => {
    it('quantity 2 scales cable and licence lines by default', () => {
        const result = plan(basicFiat, { urlYear: 2020, deviceQuantity: 2 });

        expect(summary(result)).toEqual([
            ['GG-SGW-CABLE-FCCA', 2, FIAT, 2020],
            ['GG-SGW-LIC-STELLANTIS', 2, FIAT, 2020],
        ]);
        expect(result.lines[1].label).toBe('2× SGW-Lizenz Fiat/Stellantis (1 Tag)');
        expect(result.lines[1].labelParams.quantity).toBe(2);
        expect(result.deviceQuantity).toBe(2);
        expect(result.deviceTotalNet).toBe(124000);
        expect(result.totalAddOnsNet).toBe(2 * (9000 + 2000));
        expect(result.liveTotalNet).toBe(124000 + 22000);
    });

    it('main licence quantity multiplies with the device quantity', () => {
        const result = plan(basicFiat, { urlYear: 2021, deviceQuantity: 2, selections: { sgwQuantity: 3 } });

        expect(summary(result)).toEqual([['GG-SGW-LIC-STELLANTIS', 6, FIAT, 2021]]);
        expect(result.lines[0].label).toBe('6× SGW-Lizenz Fiat/Stellantis (1 Tag)');
    });

    it('scaleAddOnsWithQuantity: false reproduces the old behaviour (add-ons stay at 1)', () => {
        const result = plan(basicFiat, { urlYear: 2020, deviceQuantity: 2, scaleAddOnsWithQuantity: false });

        expect(summary(result)).toEqual([
            ['GG-SGW-CABLE-FCCA', 1, FIAT, 2020],
            ['GG-SGW-LIC-STELLANTIS', 1, FIAT, 2020],
        ]);
        expect(result.lines[1].label).toBe('SGW-Lizenz Fiat/Stellantis (1 Tag)');
        expect(result.deviceTotalNet).toBe(124000);
        expect(result.totalAddOnsNet).toBe(11000);
        expect(result.liveTotalNet).toBe(135000);
    });

    it('scales Erweiterung, module cable and Truma cable lines', () => {
        const pro = plan(proBmw, { deviceQuantity: 3, extraBrands: decodeExtraBrands(`${VW}:2021,${TRUMA}`) });

        expect(summary(pro)).toEqual([
            ['GG-PRO-EXT-CAR', 3, VW, 2021],
            ['GG-SGW-LIC-VAG', 3, VW, 2021],
            ['GG-PRO-TRUMA', 3, TRUMA, undefined],
            ['GG-CABLE-TRUMA', 3, TRUMA, undefined],
        ]);
        expect(summary(plan(womoFiat, { deviceQuantity: 2 }))).toEqual([['GG-CABLE-TRUMA', 2, undefined, undefined]]);
    });

    it('ELITE licences stay at 1, ELITE cables scale', () => {
        const result = plan(eliteCarsMb, {
            deviceQuantity: 2,
            selections: { eliteSgw: { licenses: { vag: { selected: true, duration: 'day' } }, cables: { FCCA: true } } },
        });

        expect(summary(result)).toEqual([
            ['GG-SGW-LIC-VAG', 1, undefined, undefined],
            ['GG-SGW-CABLE-FCCA', 2, undefined, undefined],
        ]);
        expect(result.lines[0].label).toBe('SGW-Lizenz VW-Gruppe (1 Tag)');
    });

    it('invalid device quantities fall back to 1', () => {
        expect(plan(basicFiat, { urlYear: 2020, deviceQuantity: 0 }).deviceQuantity).toBe(1);
        expect(plan(basicFiat, { urlYear: 2020, deviceQuantity: Number.NaN }).deviceQuantity).toBe(1);
        expect(plan(basicFiat, { urlYear: 2020, deviceQuantity: 2.9 }).lines[0].quantity).toBe(2);
    });
});

describe('missing add-on products', () => {
    it('an add-on whose product is not loaded is silently omitted', () => {
        const withoutLicence = { ...ALL_ADD_ON_PRODUCTS, 'GG-SGW-LIC-STELLANTIS': undefined };
        const result = plan(basicFiat, { urlYear: 2020, addOnProducts: withoutLicence });

        expect(summary(result)).toEqual([['GG-SGW-CABLE-FCCA', 1, FIAT, 2020]]);
        expect(result.warnings).toEqual([]);
        expect(plan(basicFiat, { urlYear: 2020, addOnProducts: {} }).lines).toEqual([]);
        expect(plan(womoFiat, { addOnProducts: {} }).lines).toEqual([]);
    });

    it('a loaded product without variants is treated as missing', () => {
        const noVariants = { ...ALL_ADD_ON_PRODUCTS, 'GG-SGW-CABLE-FCCA': { ...sgwCableFcca, variants: [] } };

        expect(summary(plan(basicFiat, { urlYear: 2020, addOnProducts: noVariants }))).toEqual([['GG-SGW-LIC-STELLANTIS', 1, FIAT, 2020]]);
    });
});

describe('getRequiredAddOnSkus (lazy-fetch list)', () => {
    it('main SGW SKUs, per extra brand Erweiterung + cable + SGW, ELITE all five, WoMo/Truma cable', () => {
        expect(getRequiredAddOnSkus(basicFiat, 2020, [])).toEqual(['GG-SGW-CABLE-FCCA', 'GG-SGW-LIC-STELLANTIS']);
        expect(getRequiredAddOnSkus(basicFiat, 2019, [])).toEqual(['GG-SGW-CABLE-FCCA']);
        expect(getRequiredAddOnSkus(basicFiat, null, [])).toEqual([]);
        expect(getRequiredAddOnSkus(proBmw, 2015, decodeExtraBrands(`${VW}:2021,${INEOS},${TRUMA},nope:2020`))).toEqual([
            'GG-PRO-EXT-CAR', 'GG-SGW-LIC-VAG', 'GG-PRO-EXT-CAR-INEOS', 'GG-PRO-TRUMA', 'GG-CABLE-TRUMA',
        ]);
        expect(getRequiredAddOnSkus(proBmw, null, decodeExtraBrands(`${VW}`))).toEqual(['GG-PRO-EXT-CAR']);
        expect(getRequiredAddOnSkus(eliteCarsMb, null, [])).toEqual([
            'GG-SGW-LIC-STELLANTIS', 'GG-SGW-LIC-MERCEDES', 'GG-SGW-LIC-VAG', 'GG-SGW-CABLE-IVE', 'GG-SGW-CABLE-FCCA',
        ]);
        expect(getRequiredAddOnSkus(eliteCarsMx, null, [])).toEqual([]);
        expect(getRequiredAddOnSkus(womoFiat, 2020, [])).toEqual(['GG-SGW-CABLE-FCCA', 'GG-SGW-LIC-STELLANTIS', TRUMA_CABLE_SKU]);
        expect(getRequiredAddOnSkus(proTruma, null, [])).toEqual([TRUMA_CABLE_SKU]);
        expect(getRequiredAddOnSkus(proExtCar, null, [])).toEqual([]);
    });
});

describe('buildCartLines', () => {
    it('base line first with the picker selections, then the add-on lines in plan order', () => {
        const result = plan(proFiat, { urlYear: 2020, extraBrands: decodeExtraBrands(`${VW}:2021`), deviceQuantity: 2 });
        const lines = buildCartLines(proFiat, proFiat.variants[0], 2, result);

        expect(lines).toEqual([
            { productVariantId: variantId(proFiat), quantity: 2, customFields: { selectedBrandGroupId: FIAT, selectedYear: 2020, selectedBrandGroupIds: undefined } },
            { productVariantId: variantId(sgwCableFcca), quantity: 2, customFields: { selectedBrandGroupId: FIAT, selectedYear: 2020 } },
            { productVariantId: variantId(licStellantis, 'day'), quantity: 2, customFields: { selectedBrandGroupId: FIAT, selectedYear: 2020 } },
            { productVariantId: variantId(proExtCar), quantity: 2, customFields: { selectedBrandGroupId: VW, selectedYear: 2021 } },
            { productVariantId: variantId(licVag, 'day'), quantity: 2, customFields: { selectedBrandGroupId: VW, selectedYear: 2021 } },
        ]);
    });

    it('uses the selected variant id and the product brand group without a year', () => {
        const product = simpleProduct('GG-PRO-CAR-TESLA', 82000, 'GlobeGuard PRO – Tesla', { brandGroupId: 'cars-vans-tesla', tierKey: 'PRO' });
        const lines = buildCartLines(product, product.variants[0], 1, plan(product));

        expect(lines).toEqual([
            { productVariantId: variantId(product), quantity: 1, customFields: { selectedBrandGroupId: 'cars-vans-tesla', selectedYear: undefined, selectedBrandGroupIds: undefined } },
        ]);
    });
});
