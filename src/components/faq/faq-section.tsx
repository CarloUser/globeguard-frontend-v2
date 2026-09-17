import {getTranslations} from 'next-intl/server';
import {FaqAccordion} from '@/components/faq/faq-accordion';
import {FaqJsonLd} from '@/components/faq/faq-json-ld';
import {getRouteLocale} from '@/i18n/server';
import {getSitePageFaq, type SitePageFaq} from '@/lib/vendure/faq';
import {cn} from '@/lib/utils';

interface FaqSectionProps {
    /** FAQ plugin page key, e.g. "support", "produkte-basic" (see the backend SITE_FAQ_PAGE_DEFINITIONS). */
    pageKey: string;
    /** Overrides the section title from the backend (falls back to `Faq.title`). */
    heading?: string;
    /** Heading level for the section title (default h2). */
    headingLevel?: 'h2' | 'h3';
    className?: string;
}

/**
 * Embeddable FAQ block for any page: fetches the published `sitePageFaq(pageKey)` in the
 * request locale and renders title, intro, accordion and (when this page is the canonical
 * owner) FAQPage JSON-LD. Renders nothing when no section exists or the shop API fails, so
 * that a missing FAQ never breaks the host page.
 */
export async function FaqSection({pageKey, heading, headingLevel = 'h2', className}: FaqSectionProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Faq'});

    let section: SitePageFaq | null;
    try {
        section = await getSitePageFaq(pageKey, locale);
    } catch (error) {
        console.error(`[faq] Failed to load sitePageFaq("${pageKey}", ${locale})`, error);
        return null;
    }

    if (!section || section.items.length === 0) {
        return null;
    }

    const Heading = headingLevel;

    return (
        <section className={cn('rounded-md border border-slate-200 bg-white p-5 md:p-8', className)}>
            <Heading className="text-2xl font-bold text-foreground">{heading ?? section.title ?? t('title')}</Heading>
            {section.intro && <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">{section.intro}</p>}
            <FaqAccordion items={section.items} className="mt-4" />
            <FaqJsonLd section={section} pageKey={pageKey} />
        </section>
    );
}
