/**
 * Adapter from the gql.tada `CatalogProduct` fragment (src/lib/vendure/catalog.ts) to the
 * framework-independent domain shape used by the picker / add-on plan modules.
 *
 * Accepts the masked fragment ref every catalogue query returns (`getTierProducts`,
 * `getProductBySlug`, `getProductsBySlugs`) as well as an already-unmasked result;
 * `readFragment` is a runtime no-op that only unmasks the type. Nothing here runs GraphQL,
 * so the module is usable from both server and client components.
 *
 * Mapping (cross-package contract, Phase 2e / U1):
 * - id, slug, name                       -> as-is
 * - customFields.brandGroupId / tierKey  -> brandGroupId / tierKey (null when absent)
 * - variants[]                           -> { id, sku, name, priceNet: variant.price (NET Rappen),
 *                                             options[{ groupCode: group.code, code, name }],
 *                                             compatibleFromYear / compatibleToYear }
 * - sku                                  -> first variant SKU ('' for a product without variants)
 */
import {readFragment, type FragmentOf, type ResultOf} from '@/graphql';
import {CatalogProductFragment} from '@/lib/vendure/catalog';

import {skuToProductSlug} from './picker';
import type {CatalogProduct, CatalogVariant} from './types';

/** Masked fragment ref (what the catalogue helpers return) or its unmasked data. */
export type GqlCatalogProduct = FragmentOf<typeof CatalogProductFragment> | ResultOf<typeof CatalogProductFragment>;
export type GqlCatalogProductData = ResultOf<typeof CatalogProductFragment>;
export type GqlCatalogVariant = GqlCatalogProductData['variants'][number];

export function toCatalogVariant(variant: GqlCatalogVariant): CatalogVariant {
    return {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        priceNet: variant.price,
        options: variant.options.map((option) => ({
            groupCode: option.group.code,
            code: option.code,
            name: option.name,
        })),
        compatibleFromYear: variant.customFields?.compatibleFromYear ?? null,
        compatibleToYear: variant.customFields?.compatibleToYear ?? null,
    };
}

export function toCatalogProduct(product: GqlCatalogProduct): CatalogProduct {
    const data = readFragment(CatalogProductFragment, product);
    const variants = data.variants.map(toCatalogVariant);

    return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        brandGroupId: data.customFields?.brandGroupId ?? null,
        tierKey: data.customFields?.tierKey ?? null,
        sku: variants[0]?.sku ?? '',
        variants,
    };
}

export function toCatalogProducts(list: readonly GqlCatalogProduct[]): CatalogProduct[] {
    return list.map(toCatalogProduct);
}

/**
 * Key add-on products by the SKU the domain logic asks for (see getRequiredAddOnSkus):
 * the product for SKU X lives at slug skuToProductSlug(X). SKUs whose product was not
 * loaded are simply absent, which makes buildAddOnPlan omit their lines.
 */
export function indexAddOnProductsBySku(
    skus: readonly string[],
    products: readonly CatalogProduct[],
): Record<string, CatalogProduct> {
    const bySlug = new Map(products.map((product) => [product.slug, product] as const));
    const result: Record<string, CatalogProduct> = {};

    for (const sku of skus) {
        const product = bySlug.get(skuToProductSlug(sku));

        if (product) {
            result[sku] = product;
        }
    }

    return result;
}
