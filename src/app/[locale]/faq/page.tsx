import type {Metadata} from 'next';
import {HelpCircle, Mail} from 'lucide-react';
import {getFormatter, getTranslations} from 'next-intl/server';
import {FaqAccordion} from '@/components/faq/faq-accordion';
import {FaqJsonLd} from '@/components/faq/faq-json-ld';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {getSitePageFaq} from '@/lib/vendure/faq';

/** FAQ plugin page key of this route (backend SITE_FAQ_PAGE_DEFINITIONS: `faq` -> /faq). */
const FAQ_PAGE_KEY = 'faq';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Faq'});
    const section = await getSitePageFaq(FAQ_PAGE_KEY, locale);

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: section?.title || t('title'),
        description: section?.intro || t('intro'),
        alternates: buildAlternates(locale, '/faq'),
    };
}

/**
 * FAQ page fed by the backend FAQ plugin (`sitePageFaq(pageKey: "faq")` in the request
 * language). An empty section is the normal case until the editors publish content, so the
 * page renders an empty state instead of failing; FAQPage JSON-LD is emitted only with items.
 */
export default async function FaqPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Faq'});
    const format = await getFormatter({locale});
    const section = await getSitePageFaq(FAQ_PAGE_KEY, locale);
    const hasItems = !!section && section.items.length > 0;
    const lastReviewed = section?.lastReviewedAt ? new Date(section.lastReviewedAt) : null;

    return (
        <main id="main-content" className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{section?.title || t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{section?.intro || t('intro')}</p>
                    {lastReviewed && !Number.isNaN(lastReviewed.getTime()) && (
                        <p className="mt-4 text-xs text-slate-500">
                            <time dateTime={lastReviewed.toISOString()}>
                                {t('lastReviewed', {date: format.dateTime(lastReviewed, {dateStyle: 'long'})})}
                            </time>
                        </p>
                    )}
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    {hasItems ? (
                        <div className="rounded-md border border-slate-200 bg-white px-5 md:px-8">
                            <FaqAccordion items={section.items} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
                            <span className="flex size-12 items-center justify-center rounded-md bg-slate-100 text-primary">
                                <HelpCircle className="size-6" />
                            </span>
                            <h2 className="mt-4 text-lg font-semibold text-foreground">{t('emptyTitle')}</h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{t('emptyBody')}</p>
                            <Link href="/kontakt" className="btn-primary mt-6">
                                <Mail className="mr-2 size-4" />
                                {t('contact')}
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <FaqJsonLd section={section} pageKey={FAQ_PAGE_KEY} />
        </main>
    );
}
