import {rawQuery} from './api';

export interface CompatibilityVehicleGroup {
    code: string;
    name: string;
    slug: string;
    sortOrder: number;
}

export interface CompatibilityVehicleBrand {
    code: string;
    name: string;
    slug: string;
    aliases: string[];
    vehicleGroups: string[];
    sortOrder: number;
}

export interface CompatibilityOptions {
    vehicleGroups: CompatibilityVehicleGroup[];
    brands: CompatibilityVehicleBrand[];
}

export interface CompatibilityRule {
    vehicleGroup: string;
    vehicleGroupSlug: string;
    brand: string;
    brandSlug: string;
    basicSupport: string | null;
    proSupport: boolean;
    sgwBypass: string | null;
    sgwLicense: string | null;
    note: string | null;
}

export interface CompatibilityProduct {
    productId: string;
    variantId: string;
    name: string;
    slug: string;
    sku: string;
    priceWithTax: number;
    currencyCode: string;
    productFamily: string | null;
    productType: string | null;
    collectionName: string | null;
    collectionSlug: string | null;
}

export interface CompatibilityRecommendationInput {
    vehicleGroup?: string | null;
    brand?: string | null;
}

export interface CompatibilityRecommendation {
    vehicleGroup: string | null;
    vehicleGroups: string[];
    brand: string | null;
    confidence: string;
    reason: string;
    matchedRule: CompatibilityRule | null;
    products: CompatibilityProduct[];
    adapterSuggestions: string[];
    sgwBypass: string | null;
    sgwLicense: string | null;
    notes: string[];
}

export interface ProductCompatibility {
    productId: string;
    slug: string;
    name: string;
    rows: CompatibilityRule[];
}

export const EMPTY_COMPATIBILITY_OPTIONS: CompatibilityOptions = {
    vehicleGroups: [],
    brands: [],
};

const COMPATIBILITY_OPTIONS_QUERY = `
    query GlobeGuardCompatibilityOptions {
        compatibilityOptions {
            vehicleGroups {
                code
                name
                slug
                sortOrder
            }
            brands {
                code
                name
                slug
                aliases
                vehicleGroups
                sortOrder
            }
        }
    }
`;

const COMPATIBILITY_RECOMMENDATION_QUERY = `
    query GlobeGuardCompatibilityRecommendation($input: CompatibilityRecommendationInput!) {
        compatibilityRecommendation(input: $input) {
            vehicleGroup
            vehicleGroups
            brand
            confidence
            reason
            matchedRule {
                vehicleGroup
                vehicleGroupSlug
                brand
                brandSlug
                basicSupport
                proSupport
                sgwBypass
                sgwLicense
                note
            }
            products {
                productId
                variantId
                name
                slug
                sku
                priceWithTax
                currencyCode
                productFamily
                productType
                collectionName
                collectionSlug
            }
            adapterSuggestions
            sgwBypass
            sgwLicense
            notes
        }
    }
`;

const PRODUCT_COMPATIBILITY_QUERY = `
    query GlobeGuardProductCompatibility($slug: String!) {
        productCompatibility(slug: $slug) {
            productId
            slug
            name
            rows {
                vehicleGroup
                vehicleGroupSlug
                brand
                brandSlug
                basicSupport
                proSupport
                sgwBypass
                sgwLicense
                note
            }
        }
    }
`;

export async function getCompatibilityOptions(languageCode?: string): Promise<CompatibilityOptions> {
    const result = await rawQuery<{ compatibilityOptions: CompatibilityOptions }>(
        COMPATIBILITY_OPTIONS_QUERY,
        {},
        {languageCode, tags: ['compatibility']},
    );
    return result.data.compatibilityOptions;
}

export async function getCompatibilityRecommendation(
    input: CompatibilityRecommendationInput,
    languageCode?: string,
): Promise<CompatibilityRecommendation> {
    const result = await rawQuery<{ compatibilityRecommendation: CompatibilityRecommendation }, { input: CompatibilityRecommendationInput }>(
        COMPATIBILITY_RECOMMENDATION_QUERY,
        {input},
        {languageCode, fetch: {cache: 'no-store'}},
    );
    return result.data.compatibilityRecommendation;
}

export async function getProductCompatibility(slug: string, languageCode?: string): Promise<ProductCompatibility | null> {
    const result = await rawQuery<{ productCompatibility: ProductCompatibility | null }, { slug: string }>(
        PRODUCT_COMPATIBILITY_QUERY,
        {slug},
        {languageCode, tags: [`product-${slug}`, 'compatibility']},
    );
    return result.data.productCompatibility;
}
