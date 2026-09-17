'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';

type ProductTab = 'description' | 'details';

interface ProductVariantDetail {
    id: string;
    name: string;
    sku: string;
}

interface ProductDetailTabsProps {
    description: string;
    variants?: ProductVariantDetail[];
}

/**
 * Converts a catalogue description to plain text. Vendure descriptions may contain
 * HTML; block-level closings become line breaks and remaining tags are stripped so
 * the text can be rendered with `whitespace-pre-line` without injecting HTML.
 */
function toPlainText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function ProductDetailTabs({description, variants = []}: ProductDetailTabsProps) {
    const t = useTranslations('Product');
    const [activeTab, setActiveTab] = useState<ProductTab>('description');
    const plainDescription = toPlainText(description ?? '');
    const hasDetails = variants.length > 0;

    const tabs: Array<{id: ProductTab; label: string}> = [
        {id: 'description', label: t('tabs.description')},
        ...(hasDetails ? [{id: 'details' as const, label: t('tabs.details')}] : []),
    ];

    return (
        <div className="lg:col-span-2">
            <div className="mb-8 flex gap-8 overflow-x-auto border-b border-black/5" role="tablist" aria-label={t('tabsLabel')}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            id={`product-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`product-panel-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 pb-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                isActive ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'description' && (
                <div id="product-panel-description" role="tabpanel" aria-labelledby="product-tab-description" className="max-w-none">
                    {plainDescription ? (
                        <p className="whitespace-pre-line text-slate-600">{plainDescription}</p>
                    ) : (
                        <p className="text-slate-500">{t('noDescription')}</p>
                    )}
                </div>
            )}

            {activeTab === 'details' && hasDetails && (
                <div id="product-panel-details" role="tabpanel" aria-labelledby="product-tab-details" className="max-w-none">
                    <ul className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
                        {variants.map((variant) => (
                            <li key={variant.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-semibold text-foreground">{variant.name}</span>
                                <span className="text-sm text-slate-600">{t('sku', {sku: variant.sku})}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
