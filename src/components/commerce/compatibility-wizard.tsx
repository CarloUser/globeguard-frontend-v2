'use client';

import {useMemo, useState} from 'react';
import {AlertCircle, Loader2, Search} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import type {CompatibilityOptions, CompatibilityRecommendation} from '@/lib/vendure/compatibility';

interface CompatibilityWizardProps {
    options: CompatibilityOptions;
    locale: string;
    compact?: boolean;
}

const copy = {
    en: {
        title: 'Find by brand',
        body: 'Recommendations use brand-level compatibility data. No model or year is required.',
        brand: 'Brand',
        brandPlaceholder: 'Choose brand',
        importFirst: 'Import data first',
        action: 'Find setup',
        catalog: 'Open catalog',
        confidence: 'confidence',
        coverage: 'Coverage',
        noMatch: 'Compatibility exists, but no product card is linked yet.',
        quickSearches: ['BASIC', 'PRO', 'adapter', 'SGW', 'software update'],
    },
    de: {
        title: 'Nach Marke finden',
        body: 'Empfehlungen nutzen markenbasierte Kompatibilitaetsdaten. Modell oder Baujahr ist nicht noetig.',
        brand: 'Marke',
        brandPlaceholder: 'Marke waehlen',
        importFirst: 'Daten zuerst importieren',
        action: 'Setup finden',
        catalog: 'Katalog oeffnen',
        confidence: 'Sicherheit',
        coverage: 'Abdeckung',
        noMatch: 'Kompatibilitaet vorhanden, aber noch keine Produktkarte verknuepft.',
        quickSearches: ['BASIC', 'PRO', 'Adapter', 'SGW', 'Software Update'],
    },
} as const;

export function CompatibilityWizard({options, locale, compact = false}: CompatibilityWizardProps) {
    const [brand, setBrand] = useState('');
    const [recommendation, setRecommendation] = useState<CompatibilityRecommendation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const text = locale === 'de' ? copy.de : copy.en;

    const brands = useMemo(() => [...options.brands].sort((a, b) => a.name.localeCompare(b.name)), [options.brands]);
    const groupNames = useMemo(() => new Map(options.vehicleGroups.map(group => [group.code, group.name])), [options.vehicleGroups]);
    const hasOptions = brands.length > 0;

    const formatCoverageGroups = (groups: string[]) => groups.map(group => groupNames.get(group) ?? group).join(', ');

    const formatPrice = (value: number, currencyCode: string) => new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode || 'EUR',
    }).format((Number(value) || 0) / 100);

    const requestRecommendation = async () => {
        if (!brand || isLoading) return;
        setError(null);
        setIsLoading(true);
        try {
            const selectedBrandObj = brands.find(b => b.name === brand);
            const vehicleGroup = selectedBrandObj?.vehicleGroups[0] || 'CARS&VANS';
            const response = await fetch('/api/compatibility/recommendation', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    brand,
                    vehicleGroup,
                    languageCode: locale
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Could not calculate recommendation');
            setRecommendation(payload as CompatibilityRecommendation);
        } catch (err) {
            setRecommendation(null);
            setError(err instanceof Error ? err.message : 'Could not calculate recommendation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`rounded-xl transition-all text-left ${
            compact 
                ? "border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl max-w-2xl mx-auto w-full" 
                : "border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
        }`}>
            {!compact && (
                <div className="border-b border-slate-200 p-5 dark:border-white/10 lg:p-6">
                    <h2 className="text-2xl font-extrabold text-[#101820] dark:text-white">{text.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-350">{text.body}</p>
                </div>
            )}

            <div className={compact ? "p-4 sm:p-5" : "p-5 lg:p-6"}>
                <div className={compact ? "grid items-end gap-3 sm:grid-cols-[minmax(220px,360px)_auto] sm:justify-center" : "grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]"}>
                    <label className="block text-left">
                        <span className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${
                            compact ? 'text-slate-300' : 'text-mono-label text-slate-700 dark:text-slate-300'
                        }`}>{text.brand}</span>
                        <select
                            className={`h-11 w-full rounded-md border px-3 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary ${
                                compact 
                                    ? 'border-white/10 bg-slate-900 text-white' 
                                    : 'border-slate-300 bg-white dark:border-white/10 dark:bg-[#101820] dark:text-white'
                            }`}
                            value={brand}
                            onChange={(event) => {
                                setBrand(event.target.value);
                                setRecommendation(null);
                            }}
                            disabled={!hasOptions}
                        >
                            <option value="" disabled className={compact ? 'bg-slate-900 text-white' : ''}>{hasOptions ? text.brandPlaceholder : text.importFirst}</option>
                            {brands.map(item => (
                                <option key={item.slug} value={item.name} className={compact ? 'bg-slate-900 text-white' : ''}>{item.name}</option>
                            ))}
                        </select>
                    </label>

                    <div className="flex items-end">
                        <button
                            type="button"
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 md:w-auto"
                            onClick={requestRecommendation}
                            disabled={!brand || isLoading}
                        >
                            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                            {text.action}
                        </button>
                    </div>
                </div>


                {error && (
                    <div className="mt-4 flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <AlertCircle className="mt-0.5 size-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {recommendation && (
                    <div className={`mt-4 rounded-lg border text-left ${
                        compact 
                            ? 'border-white/10 bg-slate-900/90' 
                            : 'border-slate-200 dark:border-white/10'
                    }`}>
                        <div className={`flex flex-col gap-4 border-b p-4 md:flex-row ${
                            compact ? 'border-white/10' : 'border-slate-200 dark:border-white/10'
                        }`}>
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Search className="size-6" />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-primary">{recommendation.confidence} {text.confidence}</div>
                                <h3 className={`mt-1 font-bold ${compact ? 'text-white' : 'text-[#101820] dark:text-white'}`}>{recommendation.brand || brand}</h3>
                                <p className={`mt-1 text-sm leading-6 ${compact ? 'text-slate-300' : 'text-slate-650 dark:text-slate-300'}`}>{recommendation.reason}</p>
                                {recommendation.vehicleGroups.length > 0 && (
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        {text.coverage}: {formatCoverageGroups(recommendation.vehicleGroups)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {recommendation.products.length > 0 ? (
                            <div className={`divide-y ${compact ? 'divide-white/10' : 'divide-slate-200 dark:divide-white/10'}`}>
                                {recommendation.products.slice(0, 4).map(product => (
                                    <Link
                                        key={`${product.variantId}-${product.sku}`}
                                        href={`/product/${product.slug}`}
                                        className={`grid gap-3 p-4 transition-colors sm:grid-cols-[1fr_auto] sm:items-center ${
                                            compact ? 'hover:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-mono font-bold text-primary">{product.sku}</div>
                                            <h4 className={`mt-1 font-bold ${compact ? 'text-white' : 'text-[#101820] dark:text-white'}`}>{product.name}</h4>
                                            <p className={`mt-1 text-xs ${compact ? 'text-slate-400' : 'text-slate-550 dark:text-slate-400'}`}>{product.collectionName || product.productFamily || 'Catalog match'}</p>
                                        </div>
                                        <strong className={`text-lg ${compact ? 'text-white' : 'text-[#101820] dark:text-white'}`}>{formatPrice(product.priceWithTax, product.currencyCode)}</strong>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className={`p-4 text-sm ${compact ? 'text-amber-300' : 'text-amber-800 dark:text-amber-250'}`}>{text.noMatch}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
