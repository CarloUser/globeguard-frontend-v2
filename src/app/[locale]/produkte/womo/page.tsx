import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {getTranslations} from 'next-intl/server';
import {Price} from '@/components/commerce/price';
import {TierPicker} from '@/components/configurator/tier-picker';
import {FaqSection} from '@/components/faq/faq-section';
import {PageHeader} from '@/components/marketing/page-header';
import {readFragment} from '@/graphql';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {TRUMA_CABLE_SKU} from '@/lib/globeguard/add-on-plan';
import {toCatalogProducts} from '@/lib/globeguard/catalog-adapter';
import {skuToProductSlug} from '@/lib/globeguard/picker';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {CatalogProductFragment, getProductBySlug, getTierMinPrices, getTierProducts} from '@/lib/vendure/catalog';

/**
 * /produkte/womo — WoMo finder: brand + model-year picker over the per-brand
 * GG-BASIC-WOMO-<SLUG> products (base-vehicle brand + Truma module). The vehicle-type step
 * is hidden by the picker because WoMo only has one class (car & van).
 * Copy ported from the previous storefront (src/pages/produkte/womo.tsx); the Truma cable
 * and BASIC prices in the copy are replaced by live catalogue prices when available.
 */

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Tiers.womo'});
    const alternates = buildAlternates(locale, '/produkte/womo');

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

/** A backend outage must not break the page: the picker then shows its "product loading" hint. */
async function safeTierProducts(locale: string): Promise<CatalogProduct[]> {
    try {
        const result = await getTierProducts('WOMO', locale);
        return toCatalogProducts(result.items);
    } catch (error) {
        console.error('[produkte/womo] Failed to load WOMO products', error);
        return [];
    }
}

async function safeBasicMinPrice(locale: string): Promise<number | null> {
    try {
        return (await getTierMinPrices(locale)).BASIC;
    } catch {
        return null;
    }
}

/** NET price of the Truma adapter cable set (GG-CABLE-TRUMA); `null` falls back to the copy's amount. */
async function safeTrumaCablePrice(locale: string): Promise<number | null> {
    try {
        const product = await getProductBySlug(skuToProductSlug(TRUMA_CABLE_SKU), locale);
        return product ? (readFragment(CatalogProductFragment, product).variants[0]?.price ?? null) : null;
    } catch {
        return null;
    }
}

export default async function ProdukteWomoPage() {
    const locale = await getRouteLocale();
    const [t, tMarketing, products, basicMinPrice, trumaCablePrice] = await Promise.all([
        getTranslations({locale, namespace: 'Tiers.womo'}),
        getTranslations({locale, namespace: 'Marketing.common'}),
        safeTierProducts(locale),
        safeBasicMinPrice(locale),
        safeTrumaCablePrice(locale),
    ]);

    const basicLink = (chunks: ReactNode) => (
        <Link href="/produkte/basic" className="font-semibold text-primary hover:underline">
            {chunks}
        </Link>
    );
    const trumaPrice = (chunks: ReactNode) =>
        trumaCablePrice !== null ? <Price value={trumaCablePrice} className="font-semibold text-foreground" /> : chunks;
    const basicPrice = (chunks: ReactNode) =>
        basicMinPrice !== null ? (
            <>
                {tMarketing('priceFrom')} <Price value={basicMinPrice} className="font-semibold text-foreground" />
            </>
        ) : (
            chunks
        );

    return (
        <main id="main-content" className="bg-slate-50">
            <PageHeader title={t('title')} subtitle={t('subtitle')}>
                <span className="text-mono-label mt-4 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-slate-600">
                    {t('badge')}
                </span>
            </PageHeader>

            <section className="py-8 md:py-12">
                <div className="container mx-auto max-w-6xl space-y-8 px-4 lg:px-8">
                    <TierPicker tier="WOMO" products={products} locale={locale} />

                    <aside className="rounded-md border border-slate-200 bg-white p-5 md:p-8">
                        <h2 className="text-xl font-bold text-foreground">{t('hintTitle')}</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            {t.rich('hintText', {price: trumaPrice})}
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                            {t.rich('notWomo', {link: basicLink, price: basicPrice})}
                        </p>
                    </aside>

                    <FaqSection pageKey="produkte-womo" />
                </div>
            </section>
        </main>
    );
}
