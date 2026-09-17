import type {Metadata} from 'next';
import {Suspense} from 'react';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {SearchResults} from '@/app/[locale]/search/search-results';
import {SearchTerm, SearchTermSkeleton} from '@/app/[locale]/search/search-term';
import {SearchResultsSkeleton} from '@/components/shared/skeletons/search-results-skeleton';
import {SITE_NAME, buildAlternates, noIndexRobots} from '@/lib/metadata';

export async function generateMetadata({
    searchParams,
}: PageProps<'/[locale]/search'>): Promise<Metadata> {
    const resolvedParams = await searchParams;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Search'});
    const searchQuery = resolvedParams.q as string | undefined;

    return {
        title: searchQuery ? t('resultsTitle', {query: searchQuery}) : t('pageTitle'),
        description: searchQuery
            ? t('metaDescription', {query: searchQuery, siteName: SITE_NAME})
            : t('metaCatalogDescription', {siteName: SITE_NAME}),
        robots: noIndexRobots(),
        // Canonical without the query string; the page is noindex anyway.
        alternates: buildAlternates(locale, '/search'),
    };
}

export default async function SearchPage({searchParams}: PageProps<'/[locale]/search'>) {
    return (
        <div className="bg-grid pt-12">
            <div className="container mx-auto px-4 py-12 lg:px-8">
                <Suspense fallback={<SearchTermSkeleton/>}>
                    <SearchTerm searchParams={searchParams}/>
                </Suspense>
                <Suspense fallback={<SearchResultsSkeleton />}>
                    <SearchResults searchParams={searchParams}/>
                </Suspense>
            </div>
        </div>
    );
}
