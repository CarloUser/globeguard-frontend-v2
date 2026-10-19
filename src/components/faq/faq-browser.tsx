'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Check, Link2, Mail, MessageCircle, Search, X} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Prose} from '@/components/legal/prose';
import {Link} from '@/i18n/navigation';
import {buildFaqSearchIndex, highlightPattern, searchFaq} from '@/lib/faq/search';
import {cn} from '@/lib/utils';

export interface FaqBrowserItem {
    slug: string;
    question: string;
    answerHtml: string;
    /** Answer without markup, for the search index. */
    answerText: string;
}

export interface FaqBrowserGroup {
    key: string;
    title: string;
    /** Short line under the chapter heading. */
    intro: string | null;
    items: FaqBrowserItem[];
}

interface FaqBrowserProps {
    groups: FaqBrowserGroup[];
    contactEmail: string;
    whatsappUrl: string | null;
}

const HIGHLIGHT_NAME = 'faq-search';
/** With more hits than this, only the best one opens; fewer all open. */
const AUTO_OPEN_LIMIT = 3;

/**
 * The FAQ page body: search, chapter navigation and one accordion per chapter. Every answer
 * stays in the DOM (`hiddenUntilFound`), so search engines and the browser's own find-in-page
 * see it, and the browser opens a closed answer when it finds text in it.
 */
export function FaqBrowser({groups, contactEmail, whatsappUrl}: FaqBrowserProps) {
    const t = useTranslations('Faq');
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState<string[]>([]);
    const [activeGroup, setActiveGroup] = useState(groups[0]?.key ?? '');
    const [copied, setCopied] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const items = useMemo(
        () => groups.flatMap(group => group.items.map(item => ({...item, groupKey: group.key, groupTitle: group.title}))),
        [groups],
    );
    const index = useMemo(() => buildFaqSearchIndex(items), [items]);
    const trimmed = query.trim();
    const hits = useMemo(() => (trimmed ? searchFaq(index, trimmed) : []), [index, trimmed]);
    const bySlug = useMemo(() => new Map(items.map(item => [item.slug, item])), [items]);

    // Deep links (#<question>) and a shared search (?q=) on first load.
    useEffect(() => {
        const initialQuery = new URLSearchParams(window.location.search).get('q');
        if (initialQuery) {
            setQuery(initialQuery);
            return;
        }
        const hash = decodeURIComponent(window.location.hash.slice(1));
        if (hash && bySlug.has(hash)) {
            setOpen([hash]);
            requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({block: 'start'}));
        }
    }, [bySlug]);

    // Searching opens the best hits and keeps ?q= in the address bar so a search can be shared.
    useEffect(() => {
        if (trimmed) {
            setOpen(hits.length <= AUTO_OPEN_LIMIT ? hits.map(hit => hit.slug) : hits.slice(0, 1).map(hit => hit.slug));
        }
        const timer = window.setTimeout(() => {
            const url = new URL(window.location.href);
            if (trimmed) url.searchParams.set('q', trimmed);
            else url.searchParams.delete('q');
            window.history.replaceState(window.history.state, '', url);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [trimmed, hits]);

    // Highlight the query words with the CSS Custom Highlight API (no DOM changes; browsers
    // without it simply show no highlight).
    useEffect(() => {
        const registry = typeof CSS !== 'undefined' && 'highlights' in CSS ? CSS.highlights : null;
        if (!registry) return;
        registry.delete(HIGHLIGHT_NAME);
        const pattern = trimmed ? highlightPattern(trimmed) : null;
        const container = resultsRef.current;
        if (!pattern || !container) return;
        const ranges: Range[] = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
            acceptNode: node => (node.parentElement?.closest('[data-no-highlight]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const text = node.textContent ?? '';
            for (const match of text.matchAll(pattern)) {
                const range = new Range();
                range.setStart(node, match.index);
                range.setEnd(node, match.index + match[0].length);
                ranges.push(range);
            }
        }
        registry.set(HIGHLIGHT_NAME, new Highlight(...ranges));
        return () => {
            registry.delete(HIGHLIGHT_NAME);
        };
    }, [trimmed, hits, open]);

    // Chapter navigation follows the reader.
    useEffect(() => {
        if (trimmed) return;
        const sections = groups.map(group => document.getElementById(`kapitel-${group.key}`)).filter(Boolean) as HTMLElement[];
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveGroup(visible[0].target.id.replace(/^kapitel-/, ''));
            },
            {rootMargin: '-160px 0px -55% 0px'},
        );
        sections.forEach(section => observer.observe(section));
        return () => observer.disconnect();
    }, [groups, trimmed]);

    const copyLink = useCallback(async (slug: string) => {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = slug;
        try {
            await navigator.clipboard.writeText(url.toString());
            setCopied(slug);
            window.setTimeout(() => setCopied(current => (current === slug ? null : current)), 2000);
        } catch {
            window.location.hash = slug;
        }
    }, []);

    const renderItem = (item: FaqBrowserItem, groupTitle?: string) => (
        <AccordionItem key={item.slug} value={item.slug} id={item.slug} className="scroll-mt-40 border-slate-200">
            <AccordionTrigger className="text-base font-semibold text-foreground">
                <span className="flex flex-col gap-1 pr-4">
                    {groupTitle && <span className="text-mono-label">{groupTitle}</span>}
                    <span>{item.question}</span>
                </span>
            </AccordionTrigger>
            <AccordionContent hiddenUntilFound>
                <Prose html={item.answerHtml} className="text-sm leading-6 [&_table]:block [&_table]:overflow-x-auto md:[&_table]:table" />
                <button
                    type="button"
                    onClick={() => copyLink(item.slug)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary"
                >
                    {copied === item.slug ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
                    {copied === item.slug ? t('linkCopied') : t('copyLink')}
                </button>
            </AccordionContent>
        </AccordionItem>
    );

    const topics = t.raw('topics') as string[];

    return (
        <>
            <div className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-6xl px-4 pb-8 lg:px-8">
                    <label htmlFor="faq-search" className="sr-only">
                        {t('searchLabel')}
                    </label>
                    <div className="relative max-w-2xl">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                            id="faq-search"
                            type="search"
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder={t('searchPlaceholder')}
                            autoComplete="off"
                            className="h-14 w-full rounded-md border border-slate-300 bg-white pr-12 pl-12 text-base text-foreground shadow-sm outline-none placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-foreground"
                                aria-label={t('clearSearch')}
                            >
                                <X className="size-4" aria-hidden />
                            </button>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-500">{t('topicsLabel')}</span>
                        {topics.map(topic => (
                            <button
                                key={topic}
                                type="button"
                                onClick={() => setQuery(topic)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-sm transition-colors',
                                    trimmed.toLowerCase() === topic.toLowerCase()
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary',
                                )}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 py-8 lg:px-8">
                <div className={cn('grid grid-cols-1 gap-8', !trimmed && 'lg:grid-cols-[15rem_minmax(0,1fr)]')}>
                    {!trimmed && (
                        <nav aria-label={t('chaptersLabel')} className="min-w-0 lg:sticky lg:top-36 lg:self-start">
                            <p className="mb-2 hidden text-sm font-semibold text-foreground lg:block">{t('chaptersLabel')}</p>
                            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:p-0">
                                {groups.map(group => (
                                    <li key={group.key} className="shrink-0">
                                        <a
                                            href={`#kapitel-${group.key}`}
                                            aria-current={activeGroup === group.key ? 'true' : undefined}
                                            className={cn(
                                                'flex items-baseline justify-between gap-2 rounded-full border px-3 py-1 text-sm whitespace-nowrap lg:rounded-md lg:border-0 lg:py-1.5 lg:whitespace-normal',
                                                activeGroup === group.key
                                                    ? 'border-primary bg-primary/10 font-semibold text-foreground'
                                                    : 'border-slate-300 bg-white text-slate-600 hover:text-foreground lg:bg-transparent',
                                            )}
                                        >
                                            <span>{group.title}</span>
                                            <span className="hidden text-xs text-slate-400 lg:inline">{group.items.length}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    <div ref={resultsRef} className="min-w-0">
                        {trimmed ? (
                            <section aria-live="polite">
                                <h2 data-no-highlight className="mb-4 text-sm font-normal text-slate-600">
                                    {t('resultsCount', {count: hits.length, query: trimmed})}
                                </h2>
                                {hits.length > 0 ? (
                                    <div className="rounded-md border border-slate-200 bg-white px-5 md:px-8">
                                        <Accordion multiple value={open} onValueChange={value => setOpen(value as string[])}>
                                            {hits.map(hit => {
                                                const item = bySlug.get(hit.slug)!;
                                                return renderItem(item, item.groupTitle);
                                            })}
                                        </Accordion>
                                    </div>
                                ) : (
                                    <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
                                        <h2 className="text-lg font-semibold text-foreground">{t('noResultsTitle')}</h2>
                                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{t('noResultsBody')}</p>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <Accordion multiple value={open} onValueChange={value => setOpen(value as string[])} className="gap-8">
                                {groups.map(group => (
                                    <section key={group.key} id={`kapitel-${group.key}`} aria-labelledby={`kapitel-${group.key}-titel`} className="scroll-mt-40">
                                        <h2 id={`kapitel-${group.key}-titel`} className="mb-3 text-xl font-bold text-foreground">
                                            {group.title}
                                        </h2>
                                        {group.intro && <p className="-mt-1 mb-4 max-w-3xl text-sm leading-6 text-slate-600">{group.intro}</p>}
                                        <div className="rounded-md border border-slate-200 bg-white px-5 md:px-8">
                                            {group.items.map(item => renderItem(item))}
                                        </div>
                                    </section>
                                ))}
                            </Accordion>
                        )}

                        <aside className="mt-10 flex flex-col gap-4 rounded-md bg-slate-900 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
                            <div>
                                <h2 className="text-lg font-semibold">{t('ctaTitle')}</h2>
                                <p className="mt-1 text-sm text-slate-300">{t('ctaBody')}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {whatsappUrl && (
                                    <a href={whatsappUrl} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                                        <MessageCircle className="size-4" aria-hidden />
                                        {t('whatsapp')}
                                    </a>
                                )}
                                <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                                    <Mail className="size-4" aria-hidden />
                                    {t('email')}
                                </a>
                                <Link href="/kontakt" className="inline-flex items-center rounded-md border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                                    {t('contactForm')}
                                </Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
