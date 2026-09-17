import type {Metadata} from 'next';
import {Link} from '@/i18n/navigation';
import {query} from '@/lib/vendure/api';
import {GetProductDetailQuery} from '@/lib/vendure/queries';
import {ProductImageCarousel} from '@/components/commerce/product-image-carousel';
import {ProductInfo} from '@/components/commerce/product-info';
import {getDisplayOptionGroups} from '@/lib/vendure/product-options';
import {RelatedProducts} from '@/components/commerce/related-products';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {notFound} from 'next/navigation';
import {
    SITE_NAME,
    SITE_URL,
    truncateDescription,
    buildAlternates,
    buildOgImages,
} from '@/lib/metadata';
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {ORDER_CURRENCY} from '@/lib/display-currency';
import {ProductDetailTabs} from '@/components/commerce/product-detail-tabs';

interface ProductPageProps {
    params: Promise<{locale: string; slug: string}>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getProductData(slug: string) {
    const locale = await getRouteLocale();
    return await query(GetProductDetailQuery, {slug}, {languageCode: locale});
}

export async function generateMetadata({params}: ProductPageProps): Promise<Metadata> {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const result = await getProductData(slug);
    const product = result.data.product;

    const t = await getTranslations({locale, namespace: 'Product'});

    if (!product) {
        return {
            title: t('notFound'),
        };
    }

    const description = truncateDescription(product.description);
    const fallbackDescription = t('shopProductAt', {name: product.name, siteName: SITE_NAME});
    const ogImage = product.assets?.[0]?.preview;
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

    const result = await getProductData(slug);
    const product = result.data.product;

    if (!product) {
        notFound();
    }

    const primaryCollection = product.collections?.find(c => c.parent?.id) ?? product.collections?.[0];
    const productForDisplay = {...product, optionGroups: getDisplayOptionGroups(product)};
    const variantDetails = product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
    }));

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
                                        {/* TODO(Phase 2c): repoint to /produkte/kategorie/[slug] once that route exists
                                            (or add a permanent redirect from /collection/*). */}
                                        <BreadcrumbLink render={<Link href={`/collection/${primaryCollection.slug}`} />}>
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
                        <ProductImageCarousel productName={product.name} images={product.assets} />
                        <ProductInfo product={productForDisplay} searchParams={searchParamsResolved} currencyCode={ORDER_CURRENCY} />
                    </div>

                    <div className="grid gap-12 lg:grid-cols-3">
                        <ProductDetailTabs description={product.description} variants={variantDetails} />
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
