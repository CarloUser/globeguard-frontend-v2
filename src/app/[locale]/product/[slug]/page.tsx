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
import {routing} from '@/i18n/routing';
import {
    SITE_NAME,
    SITE_URL,
    truncateDescription,
    buildCanonicalUrl,
    buildOgImages,
} from '@/lib/metadata';
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/i18n/locale-utils';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getRouteLocale} from '@/i18n/server';
import {VinChecker} from '@/components/commerce/vin-checker';
import {ProductDetailTabs} from '@/components/commerce/product-detail-tabs';
import {CalendarCheck2, Headphones, ShieldCheck, Truck} from 'lucide-react';
import {getProductCompatibility} from '@/lib/vendure/compatibility';

async function getProductData(slug: string, currencyCode: string) {
    const locale = await getRouteLocale();
    return await query(GetProductDetailQuery, {slug}, {languageCode: locale, currencyCode});
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/product/[slug]'>): Promise<Metadata> {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const result = await getProductData(slug, currencyCode);
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
    const productPath = `/product/${product.slug}`;

    return {
        metadataBase: new URL(SITE_URL),
        title: product.name,
        description: description || fallbackDescription,
        alternates: {
            canonical: buildCanonicalUrl(`/${locale}${productPath}`),
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, buildCanonicalUrl(`/${l}${productPath}`)])
            ),
        },
        openGraph: {
            title: product.name,
            description: description || fallbackDescription,
            type: 'website',
            locale: ogLocale,
            url: buildCanonicalUrl(`/${locale}${productPath}`),
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

export default async function ProductDetailPage({params, searchParams}: PageProps<'/[locale]/product/[slug]'>) {
    const {slug} = await params;
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});

    const [result, productCompatibility] = await Promise.all([
        getProductData(slug, currencyCode),
        getProductCompatibility(slug, locale).catch(() => null),
    ]);
    const product = result.data.product;

    if (!product) {
        notFound();
    }

    const primaryCollection = product.collections?.find(c => c.parent?.id) ?? product.collections?.[0];
    const productForDisplay = {...product, optionGroups: getDisplayOptionGroups(product)};
    const detailBenefits = [
        {icon: Truck, title: t('detailBenefits.fastShipping.title'), description: t('detailBenefits.fastShipping.description')},
        {icon: CalendarCheck2, title: t('detailBenefits.updateReady.title'), description: t('detailBenefits.updateReady.description')},
        {icon: ShieldCheck, title: t('detailBenefits.compatibility.title'), description: t('detailBenefits.compatibility.description')},
        {icon: Headphones, title: t('detailBenefits.support.title'), description: t('detailBenefits.support.description')},
    ];

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
                        <ProductInfo product={productForDisplay} searchParams={searchParamsResolved} currencyCode={currencyCode} />
                    </div>

                    <div className="mb-14 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {detailBenefits.map((benefit) => {
                            const Icon = benefit.icon;
                            return (
                                <div key={benefit.title} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <Icon className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-[#101820] dark:text-white">{benefit.title}</h2>
                                        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{benefit.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid gap-12 lg:grid-cols-3">
                        <ProductDetailTabs productName={product.name} productCompatibility={productCompatibility} />

                        <div>
                            <VinChecker />
                        </div>
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



