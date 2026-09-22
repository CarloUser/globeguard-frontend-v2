import {getTranslations} from 'next-intl/server';
import {MarketingSection} from '@/components/marketing/section';
import {TierTeaserCard} from '@/components/marketing/tier-teaser-card';
import type {TierMinPrices} from '@/lib/vendure/catalog';

interface TierCardsProps {
    locale: string;
    /** Live minimum NET prices per tier (null hides the amount). */
    prices: TierMinPrices;
}

/** B2C section: BASIC / WoMo / PRO teaser cards with live "ab CHF" prices. */
export async function TierCards({locale, prices}: TierCardsProps) {
    const [t, tCommon] = await Promise.all([
        getTranslations({locale, namespace: 'HomePage.b2c'}),
        getTranslations({locale, namespace: 'Marketing.common'}),
    ]);

    return (
        <MarketingSection title={t('title')} subtitle={t('subtitle')}>
            <span className="text-mono-label -mt-4 mb-4 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-slate-600">
                {tCommon('badgeB2c')}
            </span>
            <div className="grid gap-4 md:grid-cols-3">
                <TierTeaserCard
                    name={tCommon('tierBasic')}
                    text={t('basicText')}
                    priceFrom={prices.BASIC}
                    cta={{href: '/produkte/basic', label: t('basicCta')}}
                />
                <TierTeaserCard
                    name={tCommon('tierWomo')}
                    text={t('womoText')}
                    priceFrom={prices.WOMO}
                    cta={{href: '/produkte/womo', label: t('womoCta')}}
                />
                <TierTeaserCard
                    name={tCommon('tierPro')}
                    text={t('proText')}
                    priceFrom={prices.PRO}
                    cta={{href: '/produkte/pro', label: t('proCta')}}
                />
            </div>
        </MarketingSection>
    );
}
