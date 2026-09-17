'use client';

import {useId} from 'react';
import {useTranslations} from 'next-intl';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {useDisplayCurrency} from '@/components/providers/display-currency-provider';
import {DISPLAY_CURRENCIES, isDisplayCurrency, type DisplayCurrency} from '@/lib/display-currency';
import {cn} from '@/lib/utils';

const CURRENCY_CODES = Object.keys(DISPLAY_CURRENCIES) as DisplayCurrency[];

/**
 * CHF | EUR segmented toggle for the navbar utility cluster.
 * EUR is a display-only conversion (CHF x 1.1); orders stay in CHF.
 */
export function DisplayCurrencyToggle({className}: {className?: string}) {
    const t = useTranslations('Common');
    const {displayCurrency, setDisplayCurrency} = useDisplayCurrency();
    const helpId = useId();

    const labels: Record<DisplayCurrency, string> = {
        CHF: t('currencyChf'),
        EUR: t('currencyEur'),
    };

    return (
        <div className={cn('flex items-center', className)}>
            <ToggleGroup
                variant="outline"
                size="sm"
                value={[displayCurrency]}
                onValueChange={(groupValue) => {
                    const next = groupValue[0];
                    // Re-clicking the pressed item yields []; keep the current selection.
                    if (isDisplayCurrency(next) && next !== displayCurrency) {
                        setDisplayCurrency(next);
                    }
                }}
                aria-label={t('displayCurrency')}
                aria-describedby={helpId}
                title={t('eurDisplayOnly')}
            >
                {CURRENCY_CODES.map((code) => (
                    <ToggleGroupItem
                        key={code}
                        value={code}
                        className="h-8 px-2.5 text-xs font-semibold data-[pressed]:bg-muted data-[pressed]:text-foreground"
                    >
                        {labels[code]}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <span id={helpId} className="sr-only">
                {t('eurDisplayOnly')}
            </span>
        </div>
    );
}
