import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {getTranslations} from 'next-intl/server';
import {LegalPage, LegalPendingNotice} from '@/components/legal/legal-page';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

export type PendingLegalPageKey = 'agb' | 'datenschutz' | 'widerruf' | 'zahlungsarten' | 'versand';

interface PendingLegalPageOptions {
    /** Message key under `Legal.<key>` (title, description). */
    key: PendingLegalPageKey;
    /** Locale-agnostic route from the frozen route map, e.g. "/agb". */
    href: string;
    /**
     * Verified facts rendered above the pending notice (e.g. payment methods, shipping origin).
     * Receives the locale so the block can translate its own strings.
     */
    facts?: (locale: string) => ReactNode | Promise<ReactNode>;
}

/**
 * Factory for the legal pages whose text is still pending (owner decision B12):
 * translated title/description + hreflang metadata, and a `LegalPage` body consisting of the
 * optional verified facts block and the neutral "content is being prepared" notice.
 */
export function createPendingLegalPage({key, href, facts}: PendingLegalPageOptions) {
    async function generateMetadata(): Promise<Metadata> {
        const locale = await getRouteLocale();
        const t = await getTranslations({locale, namespace: `Legal.${key}`});

        return {
            metadataBase: new URL(SITE_URL),
            // The layout title template appends the site name.
            title: t('title'),
            description: t('description'),
            alternates: buildAlternates(locale, href),
        };
    }

    async function PendingLegalPage() {
        const locale = await getRouteLocale();
        const t = await getTranslations({locale, namespace: `Legal.${key}`});
        const factsNode = facts ? await facts(locale) : null;

        return (
            <LegalPage locale={locale} title={t('title')} description={t('description')} raw>
                <div className="space-y-8">
                    {factsNode}
                    <LegalPendingNotice locale={locale} />
                </div>
            </LegalPage>
        );
    }

    return {generateMetadata, PendingLegalPage};
}

interface LegalFactListProps {
    heading: string;
    items: readonly {title: string; text: string}[];
}

/** Compact definition list for the verified facts of a pending legal page. */
export function LegalFactList({heading, items}: LegalFactListProps) {
    return (
        <section>
            <h2 className="text-xl font-bold text-foreground">{heading}</h2>
            <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                {items.map((item) => (
                    <div key={item.title} className="grid gap-1 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
                        <dt className="font-semibold text-foreground">{item.title}</dt>
                        <dd className="text-base leading-7 text-slate-600">{item.text}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
