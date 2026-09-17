import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

interface SearchTermProps {
    searchParams: Promise<{
        q?: string;
        brand?: string;
    }>;
}

export async function SearchTerm({searchParams}: SearchTermProps) {
    const searchParamsResolved = await searchParams;
    const searchTerm = (searchParamsResolved.q as string) || '';
    const brandTerm = (searchParamsResolved.brand as string) || '';
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Search'});
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const tabs = [
        {label: 'All', href: '/search', query: ''},
        {label: 'BASIC', href: '/search?q=BASIC', query: 'basic'},
        {label: 'PRO', href: '/search?q=PRO', query: 'pro'},
        {label: 'Adapters', href: '/search?q=adapter', query: 'adapter'},
        {label: 'Software', href: '/search?q=software', query: 'software'},
    ];

    return (
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
                <h1 className="mb-4 text-4xl font-bold">
                    {searchTerm ? t('resultsFor', {query: searchTerm}) : brandTerm ? t('brandContext', {brand: brandTerm}) : t('title')}
                </h1>
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const isActive = tab.query ? normalizedSearchTerm === tab.query : !normalizedSearchTerm;

                        return (
                            <Link
                                key={tab.label}
                                href={tab.href}
                                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                                    isActive
                                        ? 'bg-[#101820] text-white dark:bg-white dark:text-[#101820]'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:border-[#007C9A] hover:text-[#007C9A] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-[#58D7EF] dark:hover:text-[#58D7EF]'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function SearchTermSkeleton() {
    return (
        <div className="mb-12">
            <div className="h-10 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
    );
}
