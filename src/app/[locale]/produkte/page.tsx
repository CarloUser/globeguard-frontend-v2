import type {Metadata} from 'next';
import {ArrowRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {MarketingSection} from '@/components/marketing/section';
import {PageHeader} from '@/components/marketing/page-header';
import {TierTeaserCard} from '@/components/marketing/tier-teaser-card';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {
    ELITE_LINE_TIER_KEYS,
    getCollectionChildren,
    getTierMinPrices,
    minTierPrice,
    type CatalogCollection,
} from '@/lib/vendure/catalog';

/**
 * Products hub: the four device lines with live "ab CHF ..." prices, then the three
 * non-device categories (accessories, services, software updates). Category cards link
 * to /produkte/kategorie/<slug> (Phase 2c) and list the child collections of the
 * corresponding Vendure collection so the copy never drifts from the catalogue.
 */

const CATEGORY_LISTINGS = [
    {key: 'accessories', slug: 'zubehoer'},
    {key: 'services', slug: 'services'},
    {key: 'updates', slug: 'software-updates'},
] as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Marketing.hub'});
    const alternates = buildAlternates(locale, '/produkte');

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

/** Never let an unavailable collection break the hub; the card then simply has no chips. */
async function safeCollection(slug: string, locale: string): Promise<CatalogCollection | null> {
    try {
        return await getCollectionChildren(slug, locale);
    } catch {
        return null;
    }
}

export default async function ProdukteHubPage() {
    const locale = await getRouteLocale();
    const [t, tCommon, prices, collections] = await Promise.all([
        getTranslations({locale, namespace: 'Marketing.hub'}),
        getTranslations({locale, namespace: 'Marketing.common'}),
        getTierMinPrices(locale),
        Promise.all(CATEGORY_LISTINGS.map((listing) => safeCollection(listing.slug, locale))),
    ]);

    return (
        <main id="main-content" className="bg-slate-50 pt-32">
            <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />

            {/* B2C lines */}
            <MarketingSection className="pb-6 md:pb-8">
                <span className="text-mono-label mb-4 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-slate-600">
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

            {/* B2B line */}
            <MarketingSection className="pt-6 md:pt-8">
                <span className="text-mono-label mb-4 inline-flex rounded-sm bg-slate-900 px-2 py-1 text-white">
                    {tCommon('badgeB2b')}
                </span>
                <div className="grid gap-4 md:grid-cols-3">
                    <TierTeaserCard
                        name={tCommon('tierElite')}
                        audience="b2b"
                        text={t('eliteText')}
                        priceFrom={minTierPrice(prices, ELITE_LINE_TIER_KEYS)}
                        cta={{href: '/produkte/elite', label: t('eliteCta')}}
                        className="md:col-span-2"
                    />
                </div>
            </MarketingSection>

            {/* Accessories, services, software updates */}
            <MarketingSection tone="alt" title={t('listingsTitle')}>
                <div className="grid gap-4 md:grid-cols-3">
                    {CATEGORY_LISTINGS.map((listing, index) => {
                        const children = collections[index]?.children ?? [];
                        return (
                            <article
                                key={listing.key}
                                className="flex h-full flex-col rounded-md border border-slate-200 bg-slate-50 p-5"
                            >
                                <h3 className="text-lg font-bold text-foreground">{t(`${listing.key}Name`)}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{t(`${listing.key}Text`)}</p>
                                {children.length > 0 && (
                                    <ul className="mt-4 flex flex-wrap gap-2">
                                        {children.map((child) => (
                                            <li
                                                key={child.id}
                                                className="rounded-sm border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                                            >
                                                {child.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="mt-auto pt-5">
                                    <Link
                                        href={`/produkte/kategorie/${listing.slug}`}
                                        className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                                    >
                                        {t('viewCta')}
                                        <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </MarketingSection>
        </main>
    );
}
