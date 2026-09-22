import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {EliteDeviceChooser} from '@/components/configurator/elite-device-chooser';
import {FaqSection} from '@/components/faq/faq-section';
import {PageHeader} from '@/components/marketing/page-header';
import {readFragment} from '@/graphql';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {toCatalogProducts} from '@/lib/globeguard/catalog-adapter';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {
    CatalogProductFragment,
    ELITE_LINE_TIER_KEYS,
    getTierProducts,
    type CatalogProduct as GqlCatalogProduct,
} from '@/lib/vendure/catalog';

/**
 * /produkte/elite — ELITE (B2B) device router: vehicle-class chooser that dims the device
 * cards which do not serve the chosen class (Bus and Truck/Trailer are separate devices).
 * Products come from the ELITE, ELITE_CARS_MIXED_10 and ELITE_FULL tiers.
 * Copy ported from the previous storefront (src/pages/produkte/elite.tsx).
 */

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Tiers.elite'});
    const alternates = buildAlternates(locale, '/produkte/elite');

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

interface EliteCatalog {
    products: CatalogProduct[];
    /** Featured-asset preview per product slug for the device cards. */
    images: Record<string, string | null>;
}

/** All ELITE-line tiers in parallel; a backend outage degrades to cards without prices. */
async function safeEliteCatalog(locale: string): Promise<EliteCatalog> {
    try {
        const results = await Promise.all(ELITE_LINE_TIER_KEYS.map((tierKey) => getTierProducts(tierKey, locale)));
        const items: GqlCatalogProduct[] = results.flatMap((result) => result.items);
        const images: Record<string, string | null> = {};
        for (const item of items) {
            const product = readFragment(CatalogProductFragment, item);
            images[product.slug] = product.featuredAsset?.preview ?? null;
        }
        return {products: toCatalogProducts(items), images};
    } catch (error) {
        console.error('[produkte/elite] Failed to load ELITE products', error);
        return {products: [], images: {}};
    }
}

export default async function ProdukteElitePage() {
    const locale = await getRouteLocale();
    const [t, catalog] = await Promise.all([
        getTranslations({locale, namespace: 'Tiers.elite'}),
        safeEliteCatalog(locale),
    ]);

    return (
        <main className="bg-slate-50 pt-32">
            <PageHeader title={t('title')} subtitle={t('subtitle')}>
                <span className="text-mono-label mt-4 inline-flex rounded-sm bg-slate-900 px-2 py-1 text-white">
                    {t('badge')}
                </span>
            </PageHeader>

            <section className="py-8 md:py-12">
                <div className="container mx-auto max-w-6xl space-y-8 px-4 lg:px-8">
                    <EliteDeviceChooser products={catalog.products} images={catalog.images} locale={locale} />
                    <FaqSection pageKey="produkte-elite" />
                </div>
            </section>
        </main>
    );
}
