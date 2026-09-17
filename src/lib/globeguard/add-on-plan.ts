/**
 * Add-on plan builder for the product page configurator.
 *
 * Extracted 1:1 from the previous storefront's ProductConfigurator.tsx (the
 * React-state add-on builder, lines ~398-556, the lazy-fetch SKU list at
 * ~342-395 and the base-line custom fields from ShopPageProduct.tsx:140-147)
 * into pure functions. No React, no I/O: the UI holds the selections, fetches
 * the add-on products (see getRequiredAddOnSkus) and calls buildAddOnPlan on
 * every change.
 *
 * Line order, duration-variant matching, quantity rules, the German/English
 * label texts and the silent omission of add-ons whose product is not loaded
 * are preserved exactly. The single intentional extension is the device
 * quantity scaling (decision B1, default on).
 */
import {
    ALL_BRAND_GROUPS,
    DurationCode,
    ELITE_MIXED_MAX_BRANDS,
    ELITE_MIXED_MIN_BRANDS,
    ELITE_MIXED_SKU,
    getErweiterungSku,
    getSgwRequirements,
    IBrandGroup,
    IExtraBrandSelection,
    ISgwRequirement,
    SGW_CABLE_SKUS,
    SGW_LICENSE_DURATIONS,
    SGW_LICENSE_SKUS,
    SgwCableCode,
    SgwLicenseGroup,
    skuToProductSlug,
} from './picker';
import type {
    AddOnLabelKey,
    AddOnLine,
    CartLineInput,
    CatalogProduct,
    CatalogVariant,
    OrderLineSelection,
} from './types';

// ---------------------------------------------------------------------------
// Constants / label data
// ---------------------------------------------------------------------------

/** Adapter cable set required for Truma diagnostics (WoMo device, Truma extension, Truma module slot). */
export const TRUMA_CABLE_SKU = 'GG-CABLE-TRUMA';

/** Standalone licence products (Services menu) whose variant select is the duration selector. */
export const LICENSE_PRODUCT_SKUS: string[] = [...Object.values(SGW_LICENSE_SKUS), 'GG-SVC-FERN'];

/** Main SGW licence quantity select range (1..20). */
export const SGW_LICENSE_QUANTITY_MIN = 1;
export const SGW_LICENSE_QUANTITY_MAX = 20;

export const SGW_LICENSE_LABELS_DE: Record<string, string> = {
    stellantis: 'SGW-Lizenz Fiat/Stellantis',
    mercedes: 'SGW-Lizenz Mercedes-Benz',
    vag: 'SGW-Lizenz VW-Gruppe',
};

export const SGW_LICENSE_LABELS_EN: Record<string, string> = {
    stellantis: 'SGW license Fiat/Stellantis',
    mercedes: 'SGW license Mercedes-Benz',
    vag: 'SGW license VW Group',
};

/** Human name of the ELITE SGW cable options (old `eliteCable` copy). */
export const SGW_CABLE_NAMES: Record<string, { de: string; en: string }> = {
    IVE: { de: 'Iveco Daily', en: 'Iveco Daily' },
    FCCA: { de: 'Fiat-Gruppe', en: 'Fiat group' },
};

const ADD_ON_LABELS_DE = {
    sgwCable: (cable: string) => `SGW-Bypass-Kabel (${cable})`,
    proExtension: (name: string) => `PRO Erweiterung – ${name}`,
    cableSet: (name: string) => `Adapterkabel-Set ${name}`,
    trumaCable: 'Adapterkabel-Set Truma Combi',
};

const ADD_ON_LABELS_EN: typeof ADD_ON_LABELS_DE = {
    sgwCable: (cable: string) => `SGW bypass cable (${cable})`,
    proExtension: (name: string) => `PRO Extension – ${name}`,
    cableSet: (name: string) => `Adapter cable set ${name}`,
    trumaCable: 'Adapter cable set Truma Combi',
};

// ---------------------------------------------------------------------------
// Selections (what the UI state holds) and plan output
// ---------------------------------------------------------------------------

export interface EliteSgwLicenseSelection {
    selected: boolean;
    duration: DurationCode;
}

/** ELITE (non-Mixed) free SGW multi-select: nothing preselected. */
export interface EliteSgwSelection {
    licenses: Partial<Record<SgwLicenseGroup, EliteSgwLicenseSelection>>;
    cables: Partial<Record<SgwCableCode, boolean>>;
}

export interface ConfiguratorSelections {
    /** Main-brand SGW prompt tick (auto-ticked; unticking needs the confirm dialog in the UI). */
    sgwSelected: boolean;
    /** Duration for the main licence AND for the extra-brand licences. */
    sgwDuration: DurationCode;
    /** Main licence quantity (1..20); extra-brand and ELITE licences are always 1. */
    sgwQuantity: number;
    /** Per extra-brand SGW ticks; a missing key counts as ticked. */
    extraSgwSelected: Record<string, boolean>;
    /** Truma adapter cable tick (WoMo device, Truma extension, Truma module slot). */
    trumaCableSelected: boolean;
    /** ELITE Cars Mixed: chosen brand group ids (use toggleEliteMixedBrand to edit). */
    eliteMixedBrandIds: string[];
    eliteSgw: EliteSgwSelection;
    /** Standalone PRO Erweiterung: brand group chosen in the dropdown (ignored for INEOS/Truma, which are fixed). */
    extensionBrandGroupId?: string | null;
}

export const DEFAULT_SELECTIONS: ConfiguratorSelections = {
    sgwSelected: true,
    sgwDuration: 'day',
    sgwQuantity: 1,
    extraSgwSelected: {},
    trumaCableSelected: true,
    eliteMixedBrandIds: [],
    eliteSgw: { licenses: {}, cables: {} },
    extensionBrandGroupId: null,
};

export interface AddOnPlanInput {
    product: CatalogProduct;
    selectedVariant: CatalogVariant;
    /** `?year` from the picker URL (null when absent). */
    urlYear: number | null;
    /** Decoded `?extraBrands` (see decodeExtraBrands). */
    extraBrands: IExtraBrandSelection[];
    selections: ConfiguratorSelections;
    /** Add-on products already fetched, keyed by SKU (see getRequiredAddOnSkus). Missing = line silently omitted. */
    addOnProducts: Record<string, CatalogProduct | undefined>;
    /** Number of devices being added (default 1). */
    deviceQuantity?: number;
    /**
     * Decision B1 (default true): SGW/Truma/Erweiterung line quantities are multiplied by the
     * device quantity (2 WoMo devices = 2 Truma cables). ELITE licence lines always stay at 1.
     * Pass false to reproduce the previous storefront exactly (add-ons never scaled).
     */
    scaleAddOnsWithQuantity?: boolean;
}

export type AddOnPlanWarning =
    | 'sgw-unticked'
    | 'truma-cable-unticked'
    | 'elite-no-sgw'
    | 'elite-mixed-invalid'
    | 'extension-brand-missing';

/** Warnings that must block add-to-cart (previous storefront: error toast). */
export const BLOCKING_WARNINGS: AddOnPlanWarning[] = ['extension-brand-missing', 'elite-mixed-invalid'];

/** Warnings the UI should confirm before continuing (previous storefront: window.confirm). */
export const CONFIRM_WARNINGS: AddOnPlanWarning[] = ['elite-no-sgw'];

export interface AddOnPlanFlags {
    isEliteDevice: boolean;
    isEliteMixed: boolean;
    isWomo: boolean;
    isTrumaExtension: boolean;
    isIneosExtension: boolean;
    /** tierKey PRO_ERWEITERUNG (standalone extension product). */
    isStandaloneExtension: boolean;
    /** GG-SGW-LIC-* / GG-SVC-FERN product page (duration = variant select). */
    isStandaloneLicense: boolean;
    /** Whether the configurator has anything to show at all (old `hasAnything`). */
    hasConfigurator: boolean;
}

export interface ExtraBrandRow {
    selection: IExtraBrandSelection;
    brand: IBrandGroup;
    /** ACCESSORIES module (Truma) occupying a brand slot. */
    isModule: boolean;
    /** SGW requirements for the chosen year ([] when the year is still open). */
    requirements: ISgwRequirement[];
    /** Effective tick (missing key = true). */
    sgwSelected: boolean;
}

export interface AddOnPlan {
    lines: AddOnLine[];
    warnings: AddOnPlanWarning[];
    /** Sum of priceNet × quantity over all lines. */
    totalAddOnsNet: number;
    /** selectedVariant.priceNet × deviceQuantity. */
    deviceTotalNet: number;
    /** deviceTotalNet + totalAddOnsNet (with deviceQuantity 1 identical to the old live total). */
    liveTotalNet: number;
    /** Selected variant's model-year window vs the URL year (null = no year or no window). */
    yearFits: boolean | null;
    flags: AddOnPlanFlags;
    /** Main brand group of the device (null for ELITE, licences, accessories). */
    brandGroup: IBrandGroup | null;
    /** SGW requirements of the main brand for the URL year. */
    mainSgwRequirements: ISgwRequirement[];
    /** Resolved PRO extra-brand slots in URL order (unknown ids dropped). */
    extraBrandRows: ExtraBrandRow[];
    /** Standalone PRO Erweiterung: effective brand group (fixed for INEOS/Truma, else the validated dropdown choice), null otherwise. */
    extensionBrandGroupId: string | null;
    /** ELITE Cars Mixed: chosen brand group ids carried into the base cart line (see buildCartLines), null for every other product. */
    eliteMixedBrandIds: string[] | null;
    /** Duration of the selected variant on standalone licence products (stock-up hint), null otherwise. */
    selectedVariantDuration: DurationCode | null;
    /** URL year echoed back for buildCartLines. */
    urlYear: number | null;
    deviceQuantity: number;
}

// ---------------------------------------------------------------------------
// Variant / product helpers
// ---------------------------------------------------------------------------

/**
 * Option codes are namespaced per product (e.g. gg-sgw-lic-vag-duration-year),
 * variant SKUs end in -DAY/-WEEK/-MONTH/-YEAR — match either way.
 */
export function findVariantByOptionCode(variants: CatalogVariant[] | undefined, code: string): CatalogVariant | null {
    return (variants || []).find((variant) => (
        variant.options.some((option) => option.code === code || option.code.endsWith(`-${code}`))
        || variant.sku.toUpperCase().endsWith(`-${code.toUpperCase()}`)
    )) || null;
}

/** Duration code a variant represents (same matching rules), null when none matches. */
export function getVariantDurationCode(variant: CatalogVariant | null | undefined): DurationCode | null {
    if (!variant) return null;

    return SGW_LICENSE_DURATIONS.find((entry) => (
        variant.options.some((option) => option.code === entry.code || option.code.endsWith(`-${entry.code}`))
        || variant.sku.toUpperCase().endsWith(`-${entry.code.toUpperCase()}`)
    ))?.code || null;
}

function productSku(product: CatalogProduct): string {
    return (product.sku || '').toUpperCase();
}

export function isLicenseProduct(product: CatalogProduct): boolean {
    return LICENSE_PRODUCT_SKUS.includes(productSku(product))
        || LICENSE_PRODUCT_SKUS.some((sku) => product.slug === skuToProductSlug(sku));
}

export function isEliteMixedProduct(product: CatalogProduct): boolean {
    return productSku(product) === ELITE_MIXED_SKU || product.slug === skuToProductSlug(ELITE_MIXED_SKU);
}

/** ELITE device with the free SGW multi-select (every ELITE tier except Cars Mixed). */
export function isEliteDeviceProduct(product: CatalogProduct): boolean {
    return !isEliteMixedProduct(product) && String(product.tierKey || '').startsWith('ELITE');
}

/**
 * BASIC WoMo ships with Truma diagnostics — the adapter cable set is required
 * for it but sold separately. Prefix match covers the per-brand gg-basic-womo-<slug> products.
 */
export function isWomoProduct(product: CatalogProduct): boolean {
    return product.slug.startsWith('gg-basic-womo');
}

export function isExtensionProduct(product: CatalogProduct): boolean {
    return String(product.tierKey || '') === 'PRO_ERWEITERUNG';
}

export function isIneosExtensionProduct(product: CatalogProduct): boolean {
    return productSku(product) === 'GG-PRO-EXT-CAR-INEOS';
}

export function isTrumaExtensionProduct(product: CatalogProduct): boolean {
    return productSku(product) === 'GG-PRO-TRUMA';
}

/**
 * Brand groups offered in the standalone PRO Erweiterung dropdown. INEOS and
 * Truma extensions are fixed (their own products) and get no dropdown ([]).
 */
export function getExtensionBrandOptions(product: CatalogProduct): IBrandGroup[] {
    if (!isExtensionProduct(product) || isIneosExtensionProduct(product) || isTrumaExtensionProduct(product)) {
        return [];
    }

    const extensionSku = productSku(product);
    let groups: IBrandGroup[];

    if (extensionSku === 'GG-PRO-EXT-MOTO') {
        groups = ALL_BRAND_GROUPS.filter((group) => group.vehicleGroup === 'BIKE');
    } else if (extensionSku === 'GG-PRO-EXT-TRUCK') {
        groups = ALL_BRAND_GROUPS.filter((group) => group.vehicleGroup === 'TRUCK&BUS' || group.vehicleGroup === 'TRAILER');
    } else {
        // INEOS has its own extension product with a surcharge.
        groups = ALL_BRAND_GROUPS.filter((group) => group.vehicleGroup === 'CARS&VANS' && !group.id.includes('ineos'));
    }

    return [...groups].sort((a, b) => a.displayName.localeCompare(b.displayName, 'de-CH'));
}

/** Fixed brand group of the INEOS / Truma extension products ('' for every other product). */
export function getFixedExtensionGroupId(product: CatalogProduct): string {
    if (isIneosExtensionProduct(product)) {
        return ALL_BRAND_GROUPS.find((group) => group.vehicleGroup === 'CARS&VANS' && group.id.includes('ineos'))?.id || '';
    }

    if (isTrumaExtensionProduct(product)) {
        return ALL_BRAND_GROUPS.find((group) => group.vehicleGroup === 'ACCESSORIES')?.id || '';
    }

    return '';
}

/**
 * Effective extension brand group: fixed group, else the dropdown choice — accepted only
 * when it is one of getExtensionBrandOptions(product) (a CARS&VANS id on the MOTO extension
 * or an unknown id counts as nothing chosen); '' when not an extension / nothing valid chosen.
 */
export function resolveExtensionBrandGroupId(product: CatalogProduct, chosenBrandGroupId?: string | null): string {
    if (!isExtensionProduct(product)) return '';

    const fixedGroupId = getFixedExtensionGroupId(product);

    if (fixedGroupId) return fixedGroupId;

    const chosen = chosenBrandGroupId ?? '';

    return getExtensionBrandOptions(product).some((group) => group.id === chosen) ? chosen : '';
}

function findBrandGroup(brandGroupId: string | null | undefined): IBrandGroup | null {
    return brandGroupId ? ALL_BRAND_GROUPS.find((group) => group.id === brandGroupId) || null : null;
}

function requirementSku(requirement: ISgwRequirement): string {
    return requirement.type === 'bypass-cable'
        ? SGW_CABLE_SKUS[requirement.detail]
        : SGW_LICENSE_SKUS[requirement.detail];
}

// ---------------------------------------------------------------------------
// SKUs the UI must fetch (old lazy-fetch list)
// ---------------------------------------------------------------------------

/** Add-on product SKUs the product page must load (by slug = skuToProductSlug) to build the plan. */
export function getRequiredAddOnSkus(
    product: CatalogProduct,
    urlYear: number | null,
    extraBrands: IExtraBrandSelection[],
): string[] {
    const skus = new Set<string>();
    const brandGroup = findBrandGroup(product.brandGroupId);
    const mainSgwRequirements = brandGroup && urlYear ? getSgwRequirements(brandGroup, urlYear) : [];

    mainSgwRequirements.forEach((requirement) => {
        skus.add(requirementSku(requirement));
    });

    extraBrands.forEach((selection) => {
        const extraBrand = ALL_BRAND_GROUPS.find((group) => group.id === selection.brandGroupId);

        if (!extraBrand) return;

        const extSku = getErweiterungSku(extraBrand);
        if (extSku) skus.add(extSku);
        if (extraBrand.requiresCableSku) skus.add(extraBrand.requiresCableSku);

        if (selection.year) {
            getSgwRequirements(extraBrand, selection.year).forEach((requirement) => {
                skus.add(requirementSku(requirement));
            });
        }
    });

    if (isEliteDeviceProduct(product)) {
        Object.values(SGW_LICENSE_SKUS).forEach((sku) => skus.add(sku));
        Object.values(SGW_CABLE_SKUS).forEach((sku) => skus.add(sku));
    }

    if (isWomoProduct(product) || isTrumaExtensionProduct(product)) {
        skus.add(TRUMA_CABLE_SKU);
    }

    return Array.from(skus).filter(Boolean);
}

// ---------------------------------------------------------------------------
// ELITE Cars Mixed helpers
// ---------------------------------------------------------------------------

/** Toggle a brand in the ELITE Cars Mixed selection; adding beyond the maximum is ignored. */
export function toggleEliteMixedBrand(current: string[], brandId: string): string[] {
    if (current.includes(brandId)) {
        return current.filter((id) => id !== brandId);
    }

    if (current.length >= ELITE_MIXED_MAX_BRANDS) {
        return current;
    }

    return [...current, brandId];
}

export function isEliteMixedSelectionValid(brandIds: string[]): boolean {
    return brandIds.length >= ELITE_MIXED_MIN_BRANDS && brandIds.length <= ELITE_MIXED_MAX_BRANDS;
}

// ---------------------------------------------------------------------------
// Plan builder
// ---------------------------------------------------------------------------

interface LabelSet {
    label: string;
    labelEn: string;
    labelKey: AddOnLabelKey;
    labelParams: Record<string, string | number>;
}

function licenseLabels(licenseGroup: string, sku: string, duration: string, quantity: number): LabelSet {
    const durationEntry = SGW_LICENSE_DURATIONS.find((entry) => entry.code === duration);
    const base = `${SGW_LICENSE_LABELS_DE[licenseGroup] || sku} (${durationEntry ? durationEntry.label : duration})`;
    const baseEn = `${SGW_LICENSE_LABELS_EN[licenseGroup] || sku} (${durationEntry ? durationEntry.labelEn : duration})`;

    return {
        label: quantity > 1 ? `${quantity}× ${base}` : base,
        labelEn: quantity > 1 ? `${quantity}× ${baseEn}` : baseEn,
        labelKey: 'sgwLicense',
        labelParams: { licenseGroup, duration, quantity },
    };
}

export function buildAddOnPlan(input: AddOnPlanInput): AddOnPlan {
    const {
        product, selectedVariant, urlYear, extraBrands, selections, addOnProducts,
    } = input;
    const deviceQuantity = Math.max(1, Math.floor(Number(input.deviceQuantity) || 1));
    const scale = input.scaleAddOnsWithQuantity ?? true;
    const multiplier = scale ? deviceQuantity : 1;
    /** Main licence quantity clamped to the select range (1..20); garbage → 1. Device scaling is applied on top. */
    const sgwQuantity = Math.min(
        SGW_LICENSE_QUANTITY_MAX,
        Math.max(SGW_LICENSE_QUANTITY_MIN, Math.floor(Number(selections.sgwQuantity) || 1)),
    );

    const flagsBase = {
        isEliteMixed: isEliteMixedProduct(product),
        isEliteDevice: isEliteDeviceProduct(product),
        isWomo: isWomoProduct(product),
        isStandaloneExtension: isExtensionProduct(product),
        isIneosExtension: isIneosExtensionProduct(product),
        isTrumaExtension: isTrumaExtensionProduct(product),
        isStandaloneLicense: isLicenseProduct(product),
    };

    const brandGroup = findBrandGroup(product.brandGroupId);
    const mainSgwRequirements = brandGroup && urlYear ? getSgwRequirements(brandGroup, urlYear) : [];

    const extensionBrandGroupId = resolveExtensionBrandGroupId(product, selections.extensionBrandGroupId);
    const extensionValid = !flagsBase.isStandaloneExtension || Boolean(extensionBrandGroupId);

    // --- line factories (product not loaded → null → line silently omitted) ---
    const buildLicenseAddOn = (
        licenseGroup: string,
        duration: string,
        context?: OrderLineSelection,
        quantity = 1,
        scaled = true,
    ): AddOnLine | null => {
        const sku = SGW_LICENSE_SKUS[licenseGroup];
        const licenseProduct = addOnProducts[sku];
        const variant = findVariantByOptionCode(licenseProduct?.variants, duration)
            || licenseProduct?.variants?.[0]
            || null;

        if (!licenseProduct || !variant) return null;

        const finalQuantity = scaled ? quantity * multiplier : quantity;

        return {
            sku,
            ...licenseLabels(licenseGroup, sku, duration, finalQuantity),
            variantId: variant.id,
            quantity: finalQuantity,
            priceNet: variant.priceNet,
            customFields: context,
            kind: 'sgw-license',
        };
    };

    const buildCableAddOn = (cable: string, context?: OrderLineSelection): AddOnLine | null => {
        const sku = SGW_CABLE_SKUS[cable];
        const cableProduct = addOnProducts[sku];
        const variant = cableProduct?.variants?.[0] || null;

        if (!cableProduct || !variant) return null;

        return {
            sku,
            label: ADD_ON_LABELS_DE.sgwCable(cable),
            labelEn: ADD_ON_LABELS_EN.sgwCable(cable),
            labelKey: 'sgwCable',
            labelParams: { cable },
            variantId: variant.id,
            quantity: multiplier,
            priceNet: variant.priceNet,
            customFields: context,
            kind: 'sgw-cable',
        };
    };

    const buildPlainAddOn = (
        sku: string,
        labels: LabelSet,
        kind: AddOnLine['kind'],
        context?: OrderLineSelection,
    ): AddOnLine | null => {
        const plainProduct = addOnProducts[sku];
        const variant = plainProduct?.variants?.[0] || null;

        if (!plainProduct || !variant) return null;

        return {
            sku,
            ...labels,
            variantId: variant.id,
            quantity: multiplier,
            priceNet: variant.priceNet,
            customFields: context,
            kind,
        };
    };

    const lines: AddOnLine[] = [];
    const warnings: AddOnPlanWarning[] = [];

    if (!extensionValid) {
        warnings.push('extension-brand-missing');
    }

    // --- 1. main-brand SGW (cable first, then licence — requirement order) ---
    if (selections.sgwSelected && brandGroup && urlYear) {
        mainSgwRequirements.forEach((requirement) => {
            const context = { selectedBrandGroupId: brandGroup.id, selectedYear: urlYear };
            const addOn = requirement.type === 'bypass-cable'
                ? buildCableAddOn(requirement.detail, context)
                : buildLicenseAddOn(requirement.detail, selections.sgwDuration, context, sgwQuantity);

            if (addOn) lines.push(addOn);
        });
    }

    if (!selections.sgwSelected && mainSgwRequirements.length > 0) {
        warnings.push('sgw-unticked');
    }

    // --- 2. PRO extra brands (URL order) ---
    const extraBrandRows: ExtraBrandRow[] = extraBrands
        .map((selection) => {
            const extraBrand = ALL_BRAND_GROUPS.find((group) => group.id === selection.brandGroupId) || null;

            if (!extraBrand) return null;

            return {
                selection,
                brand: extraBrand,
                isModule: Boolean(extraBrand.proAddOnSku),
                requirements: selection.year ? getSgwRequirements(extraBrand, selection.year) : [],
                sgwSelected: selections.extraSgwSelected[extraBrand.id] ?? true,
            };
        })
        .filter((row): row is ExtraBrandRow => row !== null);

    extraBrandRows.forEach(({
        selection, brand, isModule, requirements, sgwSelected,
    }) => {
        const extSku = getErweiterungSku(brand);
        const extProduct = extSku ? addOnProducts[extSku] : null;
        const extVariant = extProduct?.variants?.[0];

        if (extSku && extProduct && extVariant) {
            lines.push({
                sku: extSku,
                label: ADD_ON_LABELS_DE.proExtension(brand.displayName),
                labelEn: ADD_ON_LABELS_EN.proExtension(brand.displayName),
                labelKey: isModule ? 'proExtensionModule' : 'proExtension',
                labelParams: { name: brand.displayName, brandGroupId: brand.id },
                variantId: extVariant.id,
                quantity: multiplier,
                priceNet: extVariant.priceNet,
                customFields: {
                    selectedBrandGroupId: brand.id,
                    selectedYear: selection.year || undefined,
                },
                kind: 'erweiterung',
            });
        }

        // Modules like Truma need their adapter cable set (auto-ticked, like SGW).
        if (isModule && brand.requiresCableSku && selections.trumaCableSelected) {
            const cableAddOn = buildPlainAddOn(
                brand.requiresCableSku,
                {
                    label: ADD_ON_LABELS_DE.cableSet(brand.displayName),
                    labelEn: ADD_ON_LABELS_EN.cableSet(brand.displayName),
                    labelKey: 'cableSet',
                    labelParams: { name: brand.displayName, brandGroupId: brand.id },
                },
                'truma-cable',
                { selectedBrandGroupId: brand.id },
            );
            if (cableAddOn) lines.push(cableAddOn);
        }

        if (selection.year && sgwSelected) {
            requirements.forEach((requirement) => {
                const context = { selectedBrandGroupId: brand.id, selectedYear: selection.year || undefined };
                const addOn = requirement.type === 'bypass-cable'
                    ? buildCableAddOn(requirement.detail, context)
                    : buildLicenseAddOn(requirement.detail, selections.sgwDuration, context);

                if (addOn && !lines.some((existing) => existing.sku === addOn.sku && existing.customFields?.selectedBrandGroupId === brand.id)) {
                    lines.push(addOn);
                }
            });
        }
    });

    // --- 3. ELITE free SGW multi-select (no customFields; licences never scale) ---
    let eliteAnySelected = false;

    if (flagsBase.isEliteDevice) {
        Object.keys(SGW_LICENSE_SKUS).forEach((licenseGroup) => {
            const license = selections.eliteSgw.licenses[licenseGroup as SgwLicenseGroup];

            if (license?.selected) {
                eliteAnySelected = true;
                const addOn = buildLicenseAddOn(licenseGroup, license.duration || 'day', undefined, 1, false);
                if (addOn) lines.push(addOn);
            }
        });
        Object.keys(SGW_CABLE_SKUS).forEach((cable) => {
            if (selections.eliteSgw.cables[cable as SgwCableCode]) {
                eliteAnySelected = true;
                const addOn = buildCableAddOn(cable);
                if (addOn) lines.push(addOn);
            }
        });
    }

    // --- 4. Truma adapter cable set (WoMo device / standalone Truma extension) ---
    const trumaPrompt = flagsBase.isWomo || flagsBase.isTrumaExtension;

    if (trumaPrompt && selections.trumaCableSelected) {
        const womoCable = buildPlainAddOn(
            TRUMA_CABLE_SKU,
            {
                label: ADD_ON_LABELS_DE.trumaCable,
                labelEn: ADD_ON_LABELS_EN.trumaCable,
                labelKey: 'trumaCable',
                labelParams: {},
            },
            'truma-cable',
        );
        if (womoCable) lines.push(womoCable);
    }

    if (trumaPrompt && !selections.trumaCableSelected) {
        warnings.push('truma-cable-unticked');
    }

    // --- validity flags ---
    if (flagsBase.isEliteMixed && !isEliteMixedSelectionValid(selections.eliteMixedBrandIds)) {
        warnings.push('elite-mixed-invalid');
    }

    if (flagsBase.isEliteDevice && !eliteAnySelected) {
        warnings.push('elite-no-sgw');
    }

    // --- year compatibility (selected variant window vs URL year) ---
    const fromYear = selectedVariant.compatibleFromYear ?? null;
    const toYear = selectedVariant.compatibleToYear ?? null;
    let yearFits: boolean | null = null;

    if (urlYear && (fromYear || toYear)) {
        yearFits = (!fromYear || urlYear >= fromYear) && (!toYear || urlYear <= toYear);
    }

    const totalAddOnsNet = lines.reduce((sum, addOn) => sum + addOn.priceNet * addOn.quantity, 0);
    const deviceTotalNet = selectedVariant.priceNet * deviceQuantity;

    const hasConfigurator = product.variants.length > 1 || Boolean(urlYear) || mainSgwRequirements.length > 0
        || extraBrandRows.length > 0 || flagsBase.isEliteMixed || flagsBase.isEliteDevice || flagsBase.isWomo
        || flagsBase.isStandaloneExtension;

    return {
        lines,
        warnings,
        totalAddOnsNet,
        deviceTotalNet,
        liveTotalNet: deviceTotalNet + totalAddOnsNet,
        yearFits,
        flags: { ...flagsBase, hasConfigurator },
        brandGroup,
        mainSgwRequirements,
        extraBrandRows,
        extensionBrandGroupId: extensionBrandGroupId || null,
        eliteMixedBrandIds: flagsBase.isEliteMixed ? [...selections.eliteMixedBrandIds] : null,
        selectedVariantDuration: flagsBase.isStandaloneLicense ? getVariantDurationCode(selectedVariant) : null,
        urlYear,
        deviceQuantity,
    };
}

/** True when the plan carries a warning that must block add-to-cart. */
export function isPlanBlocked(plan: AddOnPlan): boolean {
    return plan.warnings.some((warning) => BLOCKING_WARNINGS.includes(warning));
}

// ---------------------------------------------------------------------------
// Cart lines (base device first, then the add-on lines in plan order)
// ---------------------------------------------------------------------------

/**
 * Order lines for one add-to-cart: the base device line with the picker
 * selections as custom fields (ShopPageProduct.tsx:140-147), followed by the
 * plan's add-on lines. Everything the base line needs (extension brand, URL
 * year, ELITE Mixed ids) comes from the plan, so the cart lines always match
 * the plan the UI validated. Validation is NOT applied here — check
 * isPlanBlocked and CONFIRM_WARNINGS in the UI first.
 */
export function buildCartLines(
    product: CatalogProduct,
    selectedVariant: CatalogVariant,
    quantity: number,
    plan: AddOnPlan,
): CartLineInput[] {
    const baseCustomFields: OrderLineSelection = {
        selectedBrandGroupId: plan.extensionBrandGroupId ?? product.brandGroupId ?? undefined,
        selectedYear: plan.urlYear ?? undefined,
        selectedBrandGroupIds: plan.eliteMixedBrandIds && plan.eliteMixedBrandIds.length > 0
            ? plan.eliteMixedBrandIds.join(',')
            : undefined,
    };

    return [
        { productVariantId: selectedVariant.id, quantity, customFields: baseCustomFields },
        ...plan.lines.map((addOn) => ({
            productVariantId: addOn.variantId,
            quantity: addOn.quantity,
            customFields: addOn.customFields,
        })),
    ];
}
