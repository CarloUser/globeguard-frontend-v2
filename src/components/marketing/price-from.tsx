'use client';

import {useTranslations} from 'next-intl';
import {Price, VatNote} from '@/components/commerce/price';
import {ORDER_CURRENCY} from '@/lib/display-currency';
import {cn} from '@/lib/utils';

interface PriceFromProps {
    /** Minimum NET price in Rappen, or `null` when the tier has no products yet. */
    value: number | null;
    currencyCode?: string;
    className?: string;
}

/**
 * "ab CHF 583.00 zzgl. MwSt." teaser line for tier cards. Falls back to a neutral
 * "price in shop" label instead of showing a hardcoded number when the catalogue
 * returns no products for the tier.
 */
export function PriceFrom({value, currencyCode = ORDER_CURRENCY, className}: PriceFromProps) {
    const t = useTranslations('Marketing.common');

    if (value === null) {
        return <div className={cn('text-sm font-semibold text-slate-600', className)}>{t('priceOnRequest')}</div>;
    }

    return (
        <div className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
            <span className="text-sm text-slate-500">{t('priceFrom')}</span>
            <Price value={value} currencyCode={currencyCode} className="text-2xl font-bold text-foreground" />
            <VatNote className="text-xs text-slate-500" />
        </div>
    );
}
