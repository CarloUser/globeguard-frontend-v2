import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';

import {ProductDetailTabs} from '@/components/commerce/product-detail-tabs';
import {ProductImageCarousel} from '@/components/commerce/product-image-carousel';
import {ProductInfo} from '@/components/commerce/product-info';
import {RelatedProducts} from '@/components/commerce/related-products';
import {ConfigurableProductPanel, type VariantOptionGroup} from '@/components/configurator/configurable-product-panel';
import {VehicleTypeBadge} from '@/components/configurator/vehicle-type-badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {readFragment, type ResultOf} from '@/graphql';
import {toOgLocale} from '@/i18n/locale-utils';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {ORDER_CURRENCY} from '@/lib/display-currency';
import {buildAddOnPlan, DEFAULT_SELECTIONS, getRequiredAddOnSkus, isLicenseProduct} from '@/lib/globeguard/add-on-plan';
import {indexAddOnProductsBySku, toCatalogProduct, toCatalogProducts} from '@/lib/globeguard/catalog-adapter';
import {decodeExtraBrands, skuToProductSlug, type IExtraBrandSelection} from '@/lib/globeguard/picker';
import {getProductHighlightItems} from '@/lib/globeguard/product-highlights';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {buildAlternates, buildOgImages, SITE_NAME, SITE_URL, truncateDescription} from '@/lib/metadata';
import {query} from '@/lib/vendure/api';
import {CatalogProductFragment, getProductBySlug, getProductsBySlugs} from '@/lib/vendure/catalog';
import {getDisplayOptionGroups} from '@/lib/vendure/product-options';
import {GetProductDetailQuery} from '@/lib/vendure/queries';

interface ProductPageProps {
    params: Promise<{locale: string; slug: string}>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Tier keys whose products always get the configurator panel (devices + PRO Erweiterungen). */
const CONFIGURABLE_TIER_KEYS = ['BASIC', 'WOMO', 'PRO', 'PRO_ERWEITERUNG'];

function firstParam(value: string | string[] | undefined): string | null {
    const single = Array.isArray(value) ? value[0] : value;
    return typeof single === 'string' && single.length > 0 ? single : null;
}

function isConfigurableProduct(
    product: CatalogProduct,
    urlYear: number | null,
    extraBrands: IExtraBrandSelection[],
    addOnProducts: Record<string, CatalogProduct | undefined>,
): boolean {
    // Without variants there is nothing to configure or buy, whatever the tier says.
    if (product.variants.length === 0) {
        return false;
    }

    const tierKey = String(product.tierKey || '');

    if (CONFIGURABLE_TIER_KEYS.includes(tierKey) || tierKey.startsWith('ELITE') || isLicenseProduct(product)) {
        return true;
    }

    return buildAddOnPlan({
        product,
        selectedVariant: product.variants[0],
        urlYear,
        extraBrands,
        selections: DEFAULT_SELECTIONS,
        addOnProducts,
    }).flags.hasConfigurator;
}

/** Option groups (code, translated name, options in variant order) actually used by the product's variants. */
function deriveOptionGroups(product: ResultOf<typeof CatalogProductFragment>): VariantOptionGroup[] {
    const groups = new Map<string, VariantOptionGroup>();

    for (const variant of product.variants) {
        for (const option of variant.options) {
            let group = groups.get(option.group.code);
            if (!group) {
                group = {code: option.group.code, name: option.group.name, options: []};
                groups.set(option.group.code, group);
            }
            if (!group.options.some((entry) => entry.code === option.code)) {
                group.options.push({code: option.code, name: option.name});
            }
        }
    }

    return Array.from(groups.values()).filter((group) => group.options.length > 0);
}

export async function generateMetadata({params}: ProductPageProps): Promise<Metadata> {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const gqlProduct = await getProductBySlug(slug, locale);
    const t = await getTranslations({locale, namespace: 'Product'});

    if (!gqlProduct) {
        return {
            title: t('notFound'),
        };
    }

    const product = readFragment(CatalogProductFragment, gqlProduct);
    const description = truncateDescription(product.description);
    const fallbackDescription = t('shopProductAt', {name: product.name, siteName: SITE_NAME});
    const ogImage = gqlProduct.assets?.[0]?.preview ?? product.featuredAsset?.preview;
    const ogLocale = toOgLocale(locale);
    const alternates = buildAlternates(locale, `/products/${product.slug}`);

    return {
        metadataBase: new URL(SITE_URL),
        title: product.name,
        description: description || fallbackDescription,
        alternates,
        openGraph: {
            title: product.name,
            description: description || fallbackDescription,
            type: 'website',
            locale: ogLocale,
            url: alternates.canonical,
            images: buildOgImages(ogImage, product.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: description || fallbackDescription,
            images: ogImage ? [ogImage] : undefined,
        },
    };
}

export default async function ProductDetailPage({params, searchParams}: ProductPageProps) {
    const {slug} = await params;
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});

    const gqlProduct = await getProductBySlug(slug, locale);

    // No loading.tsx for this route: a Suspense boundary above the page would flush a 200 shell
    // before notFound() runs, turning unknown slugs into soft 404s (see [locale]/layout.tsx).
    if (!gqlProduct) {
        notFound();
    }

    const detail = readFragment(CatalogProductFragment, gqlProduct);
    const product = toCatalogProduct(detail);

    // Picker context lives ONLY in the URL (previous storefront behaviour).
    const urlYear = Number(firstParam(searchParamsResolved.year)) || null;
    const extraBrands = decodeExtraBrands(firstParam(searchParamsResolved.extraBrands));

    // Add-on products (SGW licences / cables, Erweiterungen, Truma cable set) in one batch.
    const requiredSkus = getRequiredAddOnSkus(product, urlYear, extraBrands);
    const addOnBySlug = requiredSkus.length > 0
        ? await getProductsBySlugs(requiredSkus.map(skuToProductSlug), locale)
        : {};
    const addOnProducts = indexAddOnProductsBySku(requiredSkus, toCatalogProducts(Object.values(addOnBySlug)));

    const configurable = isConfigurableProduct(product, urlYear, extraBrands, addOnProducts);

    const primaryCollection = gqlProduct.collections?.find((collection) => collection.parent?.id) ?? gqlProduct.collections?.[0];
    const images = gqlProduct.assets ?? [];
    const variantDetails = detail.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
    }));

    // Plain products keep the generic purchase panel (stock level + option radios from the shop query).
    const plainDetail = configurable
        ? null
        : (await query(GetProductDetailQuery, {slug}, {languageCode: locale, tags: ['products', `product-${slug}`]})).data.product;

    const highlights = configurable
        ? getProductHighlightItems({sku: product.sku, tierKey: product.tierKey, brandGroupId: product.brandGroupId}, locale)
        : [];

    return (
        <>
            <div className="bg-grid pt-12">
                <div className="container mx-auto px-4 pb-12 pt-4 lg:px-8">
                    <Breadcrumb className="mb-8">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                            </BreadcrumbItem>
                            {primaryCollection && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink render={<Link href={`/produkte/kategorie/${primaryCollection.slug}`} />}>
                                            {primaryCollection.name}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            )}
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{product.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="mb-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-12">
                        <div className="relative lg:sticky lg:top-24 lg:self-start">
                            <VehicleTypeBadge sku={product.sku} />
                            <ProductImageCarousel productName={product.name} images={images} />
                        </div>

                        {configurable || !plainDetail ? (
                            <ConfigurableProductPanel
                                product={product}
                                optionGroups={deriveOptionGroups(detail)}
                                highlights={highlights}
                                urlYear={urlYear}
                                extraBrands={extraBrands}
                                addOnProducts={addOnProducts}
                                locale={locale}
                            />
                        ) : (
                            <ProductInfo
                                product={{...plainDetail, optionGroups: getDisplayOptionGroups(plainDetail)}}
                                searchParams={searchParamsResolved}
                                currencyCode={ORDER_CURRENCY}
                            />
                        )}
                    </div>

                    <div className="grid gap-12 lg:grid-cols-3">
                        <ProductDetailTabs description={detail.description} variants={variantDetails} />
                    </div>
                </div>
            </div>

            {primaryCollection && (
                <RelatedProducts
                    collectionSlug={primaryCollection.slug}
                    currentProductId={product.id}
                />
            )}
        </>
    );
}
