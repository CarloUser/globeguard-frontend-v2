import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {getTranslations} from 'next-intl/server';
import {PageHeader} from '@/components/marketing/page-header';
import {TierTeaserCard} from '@/components/marketing/tier-teaser-card';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {ELITE_LINE_TIER_KEYS, getTierMinPrices, minTierPrice} from '@/lib/vendure/catalog';

/**
 * General device finder — the funnel entry point ("Welches Gerät passt zu mir?").
 * The customer picks the line (BASIC / PRO / ELITE) and is routed to the tier page.
 * Key differentiators per owner: BASIC covers ONLY cars/vans + motorcycles (plus the
 * WoMo set); truck/bus/trailer/agrar/industrial classes start at PRO; 4+ brands = ELITE (B2B).
 *
 * "ab CHF ..." prices are the minimum NET variant price of the tier in the live catalogue
 * (src/lib/vendure/catalog.ts), never hardcoded.
 */

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Marketing.finder'});
    const alternates = buildAlternates(locale, '/geraet-finden');

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('seoTitle'),
        description: t('seoDescription'),
        alternates,
        openGraph: {
            title: t('seoTitle'),
            description: t('seoDescription'),
            type: 'website',
            locale: toOgLocale(locale),
            url: alternates.canonical,
        },
    };
}

export default async function GeraetFindenPage() {
    const locale = await getRouteLocale();
    const [t, tCommon, prices] = await Promise.all([
        getTranslations({locale, namespace: 'Marketing.finder'}),
        getTranslations({locale, namespace: 'Marketing.common'}),
        getTierMinPrices(locale),
    ]);

    const strong = (chunks: ReactNode) => <strong className="font-semibold text-foreground">{chunks}</strong>;
    const womoLink = (chunks: ReactNode) => (
        <Link href="/produkte/womo" className="text-primary hover:underline">
            {chunks}
        </Link>
    );

    return (
        <main id="main-content" className="bg-slate-50">
            <PageHeader title={t('heading')} subtitle={t('subtitle')} />

            <section className="py-8 md:py-12">
                <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <TierTeaserCard
                            name={tCommon('tierBasic')}
                            badge={tCommon('badgeB2c')}
                            text={t.rich('basic.text', {strong})}
                            checks={[
                                t('basic.checks.oneBrand'),
                                t('basic.checks.classes'),
                                t.rich('basic.checks.womo', {strong, link: womoLink}),
                            ]}
                            guidance={t('basic.guidance')}
                            priceFrom={prices.BASIC}
                            cta={{href: '/produkte/basic', label: t('basic.cta')}}
                        />
                        <TierTeaserCard
                            name={tCommon('tierPro')}
                            badge={tCommon('badgeB2c')}
                            text={t.rich('pro.text', {strong})}
                            checks={[t('pro.checks.expandable'), t('pro.checks.youngtimer'), t('pro.checks.truma')]}
                            guidance={t('pro.guidance')}
                            priceFrom={prices.PRO}
                            cta={{href: '/produkte/pro', label: t('pro.cta')}}
                        />
                        <TierTeaserCard
                            name={tCommon('tierElite')}
                            badge={tCommon('badgeB2b')}
                            audience="b2b"
                            text={t.rich('elite.text', {strong})}
                            checks={[t('elite.checks.mixed'), t('elite.checks.truck'), t('elite.checks.depth')]}
                            guidance={t('elite.guidance')}
                            priceFrom={minTierPrice(prices, ELITE_LINE_TIER_KEYS)}
                            cta={{href: '/produkte/elite', label: t('elite.cta')}}
                        />
                    </div>

                    <p className="mt-10 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-600">
                        <span className="font-semibold text-foreground">{t('footer.unsure')}</span>{' '}
                        <Link href="/warum-globeguard" className="text-primary hover:underline">
                            {t('footer.linkWhy')}
                        </Link>
                        {' · '}
                        <Link href="/support/sgw" className="text-primary hover:underline">
                            {t('footer.linkSgw')}
                        </Link>
                        {' · '}
                        <Link href="/support" className="text-primary hover:underline">
                            {t('footer.linkSupport')}
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
