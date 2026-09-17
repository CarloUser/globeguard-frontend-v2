'use client';

import {use, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import {ResultOf} from '@/graphql';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from '@/components/ui/collapsible';
import {SlidersHorizontal, ChevronDown, Filter} from 'lucide-react';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {useTranslations} from 'next-intl';

interface FacetFiltersProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
        token?: string;
    }>;
}

function FilterContent({
    facetGroups,
    selectedFacets,
    toggleFacet,
    clearFilters,
    hasActiveFilters,
}: {
    facetGroups: Record<string, { id: string; name: string; values: Array<{ id: string; name: string; count: number }> }>;
    selectedFacets: string[];
    toggleFacet: (facetId: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}) {
    const t = useTranslations('Filters');
    return (
        <div className="glass-panel p-6 lg:sticky lg:top-32">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-black/5 pb-4">
                <div className="flex items-center gap-2 font-bold">
                    <Filter className="size-4" />
                    {t('title')}
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                        {t('clearAll')}
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                {Object.entries(facetGroups).map(([facetName, facet]) => (
                    <Collapsible key={facet.id} defaultOpen>
                        <div>
                            <CollapsibleTrigger className="text-mono-label mb-3 flex w-full items-center justify-between text-left">
                                {facetName}
                                <ChevronDown className="size-4 transition-transform [[data-panel-open]_&]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="space-y-2">
                                    {facet.values.map((value) => {
                                        const isChecked = selectedFacets.includes(value.id);
                                        return (
                                            <div key={value.id} className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`filter-${value.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleFacet(value.id)}
                                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                                />
                                                <Label
                                                    htmlFor={`filter-${value.id}`}
                                                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 group-hover:text-foreground"
                                                >
                                                    {value.name}
                                                    <span className="font-mono text-xs text-slate-400">{value.count}</span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CollapsibleContent>
                        </div>
                    </Collapsible>
                ))}
            </div>
        </div>
    );
}

export function FacetFilters({productDataPromise}: FacetFiltersProps) {
    const t = useTranslations('Filters');
    const result = use(productDataPromise);
    const searchResult = result.data.search;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);

    interface FacetGroup {
        id: string;
        name: string;
        values: Array<{ id: string; name: string; count: number }>;
    }

    const facetGroups = searchResult.facetValues.reduce((acc: Record<string, FacetGroup>, item) => {
        const facetName = item.facetValue.facet.name;
        if (!acc[facetName]) {
            acc[facetName] = {
                id: item.facetValue.facet.id,
                name: facetName,
                values: []
            };
        }
        acc[facetName].values.push({
            id: item.facetValue.id,
            name: item.facetValue.name,
            count: item.count
        });
        return acc;
    }, {});

    const selectedFacets = searchParams.getAll('facets');

    const toggleFacet = (facetId: string) => {
        const params = new URLSearchParams(searchParams);
        const current = params.getAll('facets');

        if (current.includes(facetId)) {
            params.delete('facets');
            current.filter(id => id !== facetId).forEach(id => params.append('facets', id));
        } else {
            params.append('facets', facetId);
        }

        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
        setSheetOpen(false);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('facets');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
        setSheetOpen(false);
    };

    const hasActiveFilters = selectedFacets.length > 0;

    if (Object.keys(facetGroups).length === 0) {
        return null;
    }

    const filterContentProps = {
        facetGroups,
        selectedFacets,
        toggleFacet,
        clearFilters,
        hasActiveFilters,
    };

    return (
        <>
            <div className="lg:hidden">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger
                        render={
                            <Button variant="outline" className="w-full rounded-lg border-slate-200 bg-white">
                                <SlidersHorizontal className="mr-2 size-4" />
                                {t('filtersButton')}
                                {hasActiveFilters && (
                                    <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {selectedFacets.length}
                                    </span>
                                )}
                            </Button>
                        }
                    />
                    <SheetContent side="left" className="overflow-y-auto p-6" closeLabel={t('close')}>
                        <SheetHeader>
                            <SheetTitle>{t('title')}</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                            <FilterContent {...filterContentProps} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden lg:block">
                <FilterContent {...filterContentProps} />
            </div>
        </>
    );
}