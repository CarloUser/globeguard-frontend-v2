import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Link} from '@/i18n/navigation';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery, GetCollectionProductsQuery} from '@/lib/vendure/queries';
import {ProductGrid} from '@/components/commerce/product-grid';
import {FacetFilters} from '@/components/commerce/facet-filters';
import {ProductGridSkeleton} from '@/components/shared/product-grid-skeleton';
import {buildSearchInput, getCurrentPage} from '@/lib/search-helpers';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    SITE_NAME,
    SITE_URL,
    truncateDescription,
    buildAlternates,
    buildOgImages,
} from '@/lib/metadata';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

async function getCollectionProducts(slug: string, searchParams: { [key: string]: string | string[] | undefined }) {
    const locale = await getRouteLocale();
    return query(SearchProductsQuery, {
        input: buildSearchInput({
            searchParams,
            collectionSlug: slug
        })
    }, {languageCode: locale});
}

async function getCollectionMetadata(slug: string) {
    const locale = await getRouteLocale();
    return query(GetCollectionProductsQuery, {
        slug,
        input: {take: 0, collectionSlug: slug, groupByProduct: true},
    }, {languageCode: locale});
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/collection/[slug]'>): Promise<Metadata> {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const result = await getCollectionMetadata(slug);
    const collection = result.data.collection;

    const t = await getTranslations({locale, namespace: 'Product'});

    if (!collection) {
        return {
            title: t('collectionNotFound'),
        };
    }

    const description =
        truncateDescription(collection.description) ||
        t('browseCollectionAt', {name: collection.name, siteName: SITE_NAME});
    const ogLocale = toOgLocale(locale);
    // TODO(Phase 2c): this route moves to /produkte/kategorie/[slug]; keep the alternates in sync then.
    const alternates = buildAlternates(locale, `/collection/${collection.slug}`);

    return {
        metadataBase: new URL(SITE_URL),
        title: collection.name,
        description,
        alternates,
        openGraph: {
            title: collection.name,
            description,
            type: 'website',
            locale: ogLocale,
            url: alternates.canonical,
            images: buildOgImages(collection.featuredAsset?.preview, collection.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: collection.name,
            description,
            images: collection.featuredAsset?.preview
                ? [collection.featuredAsset.preview]
                : undefined,
        },
    };
}

export default async function CollectionPage({params, searchParams}: PageProps<'/[locale]/collection/[slug]'>) {
    const {slug} = await params;
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
    const page = getCurrentPage(searchParamsResolved);

    const productDataPromise = getCollectionProducts(slug, searchParamsResolved);
    const collectionResult = await getCollectionMetadata(slug);
    const collectionName = collectionResult.data.collection?.name ?? slug;

    return (
        <div className="bg-grid pt-12">
            <div className="container mx-auto px-4 py-12 lg:px-8">
                <Breadcrumb className="mb-8">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{collectionName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold">{collectionName}</h1>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full shrink-0 lg:w-64">
                        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
                            <FacetFilters productDataPromise={productDataPromise} />
                        </Suspense>
                    </aside>

                    <div className="flex-1">
                        <Suspense fallback={<ProductGridSkeleton />}>
                            <ProductGrid productDataPromise={productDataPromise} currentPage={page} take={12} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
