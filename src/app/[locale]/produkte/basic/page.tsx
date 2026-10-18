import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {TierPicker} from '@/components/configurator/tier-picker';
import {FaqSection} from '@/components/faq/faq-section';
import {PageHeader} from '@/components/marketing/page-header';
import {PriceFrom} from '@/components/marketing/price-from';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {toCatalogProducts} from '@/lib/globeguard/catalog-adapter';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {getTierMinPrices, getTierProducts} from '@/lib/vendure/catalog';

/**
 * /produkte/basic — BASIC finder: vehicle type (car/van or motorcycle) -> brand group ->
 * model year over the 62 per-brand GG-BASIC-* products, plus the WoMo cross-link.
 * Copy ported from the previous storefront (src/pages/produkte/basic.tsx).
 */

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Tiers.basic'});
    const alternates = buildAlternates(locale, '/produkte/basic');

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
        const result = await getTierProducts('BASIC', locale);
        return toCatalogProducts(result.items);
    } catch (error) {
        console.error('[produkte/basic] Failed to load BASIC products', error);
        return [];
    }
}

async function safeWomoMinPrice(locale: string): Promise<number | null> {
    try {
        return (await getTierMinPrices(locale)).WOMO;
    } catch {
        return null;
    }
}

export default async function ProdukteBasicPage() {
    const locale = await getRouteLocale();
    const [t, products, womoMinPrice] = await Promise.all([
        getTranslations({locale, namespace: 'Tiers.basic'}),
        safeTierProducts(locale),
        safeWomoMinPrice(locale),
    ]);

    return (
        <main id="main-content" className="bg-slate-50">
            <PageHeader title={t('title')} subtitle={t('subtitle')}>
                <span className="text-mono-label mt-4 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-slate-600">
                    {t('badge')}
                </span>
            </PageHeader>

            <section className="py-8 md:py-12">
                <div className="container mx-auto max-w-6xl space-y-8 px-4 lg:px-8">
                    <TierPicker tier="BASIC" products={products} locale={locale} />

                    <aside className="rounded-md border border-slate-200 bg-white p-5 md:p-8">
                        <h2 className="text-xl font-bold text-foreground">{t('womoTitle')}</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{t('womoText')}</p>
                        <PriceFrom value={womoMinPrice} className="mt-4" />
                        <Link href="/produkte/womo" className="btn-primary mt-4 text-sm">
                            {t('womoCta')}
                        </Link>
                    </aside>

                    <FaqSection pageKey="produkte-basic" />
                </div>
            </section>
        </main>
    );
}
