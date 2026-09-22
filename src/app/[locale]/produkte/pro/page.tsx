import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {TierPicker} from '@/components/configurator/tier-picker';
import {FaqSection} from '@/components/faq/faq-section';
import {PageHeader} from '@/components/marketing/page-header';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {toCatalogProducts} from '@/lib/globeguard/catalog-adapter';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {getTierProducts} from '@/lib/vendure/catalog';

/**
 * /produkte/pro — PRO finder over the 76 per-brand GG-PRO-* products: vehicle type (all five
 * classes) -> brand group -> model year, plus two optional extra-brand slots (PRO Erweiterung).
 * Copy ported from the previous storefront (src/pages/produkte/pro.tsx).
 */

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Tiers.pro'});
    const alternates = buildAlternates(locale, '/produkte/pro');

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
        const result = await getTierProducts('PRO', locale);
        return toCatalogProducts(result.items);
    } catch (error) {
        console.error('[produkte/pro] Failed to load PRO products', error);
        return [];
    }
}

export default async function ProduktePro() {
    const locale = await getRouteLocale();
    const [t, products] = await Promise.all([
        getTranslations({locale, namespace: 'Tiers.pro'}),
        safeTierProducts(locale),
    ]);

    return (
        <main id="main-content" className="bg-slate-50 pt-32">
            <PageHeader title={t('title')} subtitle={t('subtitle')}>
                <span className="text-mono-label mt-4 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-slate-600">
                    {t('badge')}
                </span>
            </PageHeader>

            <section className="py-8 md:py-12">
                <div className="container mx-auto max-w-6xl space-y-8 px-4 lg:px-8">
                    <TierPicker tier="PRO" products={products} locale={locale} />
                    <FaqSection pageKey="produkte-pro" />
                </div>
            </section>
        </main>
    );
}
