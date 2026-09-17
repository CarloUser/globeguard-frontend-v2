'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useDisplayCurrency} from '@/components/providers/display-currency-provider';
import {formatMoney, ORDER_CURRENCY, toPriceLocale} from '@/lib/display-currency';

interface PriceProps {
    /** NET amount in minor units (Rappen), exactly as returned by Vendure. */
    value: number;
    /**
     * Currency of `value`. Orders are CHF-only, so this is 'CHF' in practice; any other
     * code is formatted as-is without display conversion.
     */
    currencyCode?: string;
    /** Append the "zzgl. MwSt." note inline after the amount. */
    showVatNote?: boolean;
    className?: string;
}

/**
 * Formats a NET CHF price in the visitor's display currency (CHF, or EUR = CHF x 1.1,
 * display-only) using de-CH / en-CH number formatting.
 */
export function Price({value, currencyCode = ORDER_CURRENCY, showVatNote = false, className}: PriceProps) {
    const locale = useLocale();
    const t = useTranslations('Common');
    const {displayCurrency} = useDisplayCurrency();

    const isConvertible = currencyCode === ORDER_CURRENCY;
    const isConverted = isConvertible && displayCurrency !== ORDER_CURRENCY;
    const formatted = isConvertible
        ? formatMoney(value, displayCurrency, locale)
        : new Intl.NumberFormat(toPriceLocale(locale), {style: 'currency', currency: currencyCode}).format(value / 100);

    return (
        <span className={className} title={isConverted ? t('eurDisplayOnly') : undefined}>
            {formatted}
            {showVatNote && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">{t('exclVat')}</span>
            )}
        </span>
    );
}

/** Standalone "zzgl. MwSt." / "excl. VAT" note for placing under a price. */
export function VatNote({className}: {className?: string}) {
    const t = useTranslations('Common');
    return <span className={className}>{t('exclVat')}</span>;
}
