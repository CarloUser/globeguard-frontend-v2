import type {ReactNode} from 'react';
import {FileText} from 'lucide-react';
import {getFormatter, getTranslations} from 'next-intl/server';
import {CompanyContactBlock} from '@/components/legal/company-contact-block';
import {Prose} from '@/components/legal/prose';

export interface LegalPageTocEntry {
    /** Element id of the section heading inside the page body. */
    id: string;
    label: string;
}

export interface LegalPageProps {
    locale: string;
    title: string;
    /** Short lead paragraph under the title (the pages reuse it as the meta description). */
    description?: string;
    /** Date of the last revision of the text; omitted while a text is still pending. */
    lastUpdated?: Date | string | null;
    /** Optional in-page table of contents rendered above the contact block. */
    toc?: readonly LegalPageTocEntry[];
    /** Page body. Rendered inside a `Prose` container unless `raw` is set. */
    children: ReactNode;
    /** Skip the `Prose` wrapper (for bodies that bring their own layout). */
    raw?: boolean;
    /** Replace the default company contact block in the aside. */
    aside?: ReactNode;
}

/**
 * Shared layout of the legal/company pages (/impressum, /agb, /datenschutz, /widerruf,
 * /zahlungsarten, /versand, /ueber-uns): title, optional "last updated" line, a prose body
 * and an aside with the verified company contact block (plus an optional table of contents).
 */
export async function LegalPage({locale, title, description, lastUpdated, toc, children, raw, aside}: LegalPageProps) {
    const t = await getTranslations({locale, namespace: 'Legal.common'});
    const format = await getFormatter({locale});
    const lastUpdatedDate = lastUpdated ? new Date(lastUpdated) : null;
    const hasLastUpdated = lastUpdatedDate !== null && !Number.isNaN(lastUpdatedDate.getTime());

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
                    {description && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>}
                    {hasLastUpdated && (
                        <p className="mt-4 text-xs text-slate-500">
                            <time dateTime={lastUpdatedDate.toISOString()}>
                                {t('lastUpdated', {date: format.dateTime(lastUpdatedDate, {dateStyle: 'long'})})}
                            </time>
                        </p>
                    )}
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                        <article className="rounded-md border border-slate-200 bg-white p-5 md:p-8">
                            {raw ? children : <Prose>{children}</Prose>}
                        </article>
                        <aside className="space-y-6">
                            {toc && toc.length > 0 && (
                                <nav aria-label={t('onThisPage')} className="rounded-md border border-slate-200 bg-white p-5">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                                        {t('onThisPage')}
                                    </h2>
                                    <ol className="mt-3 space-y-2 text-sm">
                                        {toc.map((entry) => (
                                            <li key={entry.id}>
                                                <a href={'#' + entry.id} className="text-slate-600 hover:text-primary">
                                                    {entry.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ol>
                                </nav>
                            )}
                            {aside ?? <CompanyContactBlock locale={locale} />}
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
}

/**
 * Neutral "this text is being prepared" notice for legal pages whose text is still pending
 * (owner decision B12). Renders inside the `Prose` body of `LegalPage`.
 */
export async function LegalPendingNotice({locale}: {locale: string}) {
    const t = await getTranslations({locale, namespace: 'Legal.common'});

    return (
        <div className="flex gap-4 rounded-md border border-slate-200 bg-slate-50 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-primary">
                <FileText className="size-5" />
            </span>
            <div>
                <p className="font-semibold text-foreground">{t('pendingTitle')}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t('pendingBody')}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t('pendingHint')}</p>
            </div>
        </div>
    );
}
