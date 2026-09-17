/**
 * Framework-independent catalogue / order-line types used by the GlobeGuard
 * domain modules (picker, add-on plan, highlights). The UI maps Vendure Shop
 * API results onto these shapes; nothing in src/lib/globeguard imports React,
 * next-intl or gql.tada.
 *
 * All prices are NET amounts in minor units (Rappen) — the shop displays net,
 * VAT is added at checkout.
 */

export interface CatalogVariantOption {
    groupCode: string;
    code: string;
    name: string;
}

export interface CatalogVariant {
    id: string;
    sku: string;
    name: string;
    /** NET price in Rappen. */
    priceNet: number;
    options: CatalogVariantOption[];
    /** Model-year window from the variant custom fields (null/undefined = open). */
    compatibleFromYear?: number | null;
    compatibleToYear?: number | null;
}

export interface CatalogProduct {
    id: string;
    slug: string;
    name: string;
    /** brand-compatibility.json group id (BASIC/WOMO/PRO devices). */
    brandGroupId?: string | null;
    /** BASIC | WOMO | PRO | ELITE | ELITE_CARS_MIXED_10 | ELITE_FULL | PRO_ERWEITERUNG | SGW_LICENSE | SERVICE | ZUBEHOER | ... */
    tierKey?: string | null;
    /** SKU of the default (or currently selected) variant. */
    sku: string;
    variants: CatalogVariant[];
}

/** OrderLine custom fields carrying the configurator selections. */
export interface OrderLineSelection {
    selectedBrandGroupId?: string;
    selectedYear?: number;
    /** ELITE Cars Mixed: comma-joined brand group ids. */
    selectedBrandGroupIds?: string;
}

export type AddOnKind = 'sgw-license' | 'sgw-cable' | 'erweiterung' | 'truma-cable';

/** Translation key of an add-on line label (params in `labelParams`). */
export type AddOnLabelKey =
    | 'sgwLicense'
    | 'sgwCable'
    | 'proExtension'
    | 'proExtensionModule'
    | 'cableSet'
    | 'trumaCable';

/** One add-on order line the product page creates alongside the base device. */
export interface AddOnLine {
    sku: string;
    /** German line label (business data, identical to the previous storefront copy). */
    label: string;
    /** English line label. */
    labelEn: string;
    /** Key + params so the UI can localise the label via next-intl instead of using `label`. */
    labelKey: AddOnLabelKey;
    labelParams: Record<string, string | number>;
    variantId: string;
    quantity: number;
    /** NET unit price in Rappen. */
    priceNet: number;
    customFields?: OrderLineSelection;
    kind: AddOnKind;
}

/** Input for one `addItemToOrder` call. */
export interface CartLineInput {
    productVariantId: string;
    quantity: number;
    customFields?: OrderLineSelection;
}
