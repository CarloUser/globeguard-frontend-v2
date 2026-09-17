'use client';

import {useState, useEffect, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {Search} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {useTranslations} from 'next-intl';

export function SearchInput() {
    const t = useTranslations('Navigation');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

    useEffect(() => {
        setSearchValue(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) return;
        startTransition(() => {
            router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"/>
            <Input
                type="search"
                placeholder={t('searchProducts')}
                className="h-10 w-[34vw] min-w-[220px] max-w-[520px] rounded-md border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-white/5"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                disabled={isPending}
            />
        </form>
    );
}
