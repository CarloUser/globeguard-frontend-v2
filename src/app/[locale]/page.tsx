import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {JsonLdScript} from '@/components/seo/json-ld';
import {FaqSection} from '@/components/faq/faq-section';
import {Benefits} from '@/components/home/benefits';
import {EliteBand} from '@/components/home/elite-band';
import {HomeHero} from '@/components/home/home-hero';
import {LatestPosts} from '@/components/home/latest-posts';
import {TierCards} from '@/components/home/tier-cards';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {SITE_NAME, SITE_URL, buildAlternates} from '@/lib/metadata';
import {buildOrganizationJsonLd, buildWebSiteJsonLd} from '@/lib/seo/structured-data';
import {CATALOG_TIER_KEYS, getTierMinPrices, type TierMinPrices} from '@/lib/vendure/catalog';
import {getSitePageFaq} from '@/lib/vendure/faq';

/**
 * Home page (structure ported from the previous storefront's pages/index.tsx):
 * hero -> B2C tier cards (BASIC / WoMo / PRO, live "ab CHF" prices) -> B2B ELITE band ->
 * USP cards -> latest blog posts -> homepage FAQ. Organization + WebSite JSON-LD are
 * emitted once here (src/lib/seo/structured-data.ts).
 */

const HOMEPAGE_FAQ_PAGE_KEY = 'homepage';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const [tHome, tPage] = await Promise.all([
        getTranslations({locale, namespace: 'Home'}),
        getTranslations({locale, namespace: 'HomePage'}),
    ]);
    const ogLocale = toOgLocale(locale);
    const alternates = buildAlternates(locale, '/');
    const title = `${SITE_NAME} - ${tHome('tagline')}`;

    return {
        metadataBase: new URL(SITE_URL),
        title: {
            absolute: title,
        },
        description: tPage('seoDescription'),
        alternates,
        openGraph: {
            title,
            description: tPage('seoDescription'),
            type: 'website',
            locale: ogLocale,
            url: alternates.canonical,
        },
    };
}

/** Live tier prices; an unreachable catalogue must not break the home page (cards then show the fallback label). */
async function loadTierPrices(locale: string): Promise<TierMinPrices> {
    try {
        return await getTierMinPrices(locale);
    } catch (error) {
        console.error('[home] Failed to load tier prices', error);
        return Object.fromEntries(CATALOG_TIER_KEYS.map((key) => [key, null])) as TierMinPrices;
    }
}

/**
 * Whether the homepage FAQ section has content, so the surrounding band is only rendered when
 * `<FaqSection/>` will render something. Shares the request-scoped cache with the section.
 */
async function hasHomepageFaq(locale: string): Promise<boolean> {
    try {
        const section = await getSitePageFaq(HOMEPAGE_FAQ_PAGE_KEY, locale);
        return !!section && section.items.length > 0;
    } catch {
        return false;
    }
}

export default async function Home() {
    const locale = await getRouteLocale();
    const [prices, showFaq] = await Promise.all([loadTierPrices(locale), hasHomepageFaq(locale)]);
    const jsonLd = [buildOrganizationJsonLd(), buildWebSiteJsonLd()];

    return (
        <main className="flex w-full flex-col bg-slate-50">
            <JsonLdScript data={jsonLd} />

            <HomeHero locale={locale} />
            <TierCards locale={locale} prices={prices} />
            <EliteBand locale={locale} />
            <Benefits locale={locale} />
            <LatestPosts locale={locale} />

            {showFaq && (
                <section className="py-12 md:py-16">
                    <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                        <FaqSection pageKey={HOMEPAGE_FAQ_PAGE_KEY} />
                    </div>
                </section>
            )}
        </main>
    );
}
