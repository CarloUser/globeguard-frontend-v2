import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

interface SearchTermProps {
    searchParams: Promise<{
        q?: string;
    }>;
}

export async function SearchTerm({searchParams}: SearchTermProps) {
    const searchParamsResolved = await searchParams;
    const searchTerm = (searchParamsResolved.q as string) || '';
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Search'});

    return (
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h1 className="text-4xl font-bold text-foreground">
                {searchTerm ? t('resultsFor', {query: searchTerm}) : t('title')}
            </h1>
        </div>
    );
}

export function SearchTermSkeleton() {
    return (
        <div className="mb-12">
            <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        </div>
    );
}
