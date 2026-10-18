import type {Metadata} from 'next';
import {Check} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {MarketingSection} from '@/components/marketing/section';
import {TierComparisonTable} from '@/components/marketing/tier-comparison-table';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

/**
 * "Warum GlobeGuard" — feature showcase across BASIC / WoMo / PRO / ELITE.
 *
 * Every claim is the owner-approved copy ported from the previous storefront (sourced
 * from the portfolio flyer V107, the Starter manual and the old globeguard.ch product
 * pages). The diagnostic feature set is identical across all tiers — the lines differ in
 * brand count, model-year coverage and target group, not in diagnostic depth. Add no new
 * claims here; edit the copy only in messages/<locale>/marketing.json.
 */

const HERO_BADGES = ['remote', 'updates', 'license', 'shipping'] as const;

const PILLARS = [
    {key: 'diagnostics', items: ['systems', 'liveData', 'identification']},
    {key: 'coding', items: ['dpf', 'injector', 'resets']},
    {key: 'remote', items: ['setup', 'onTheRoad', 'audience']},
] as const;

const WORKSHOP_JOBS = ['dpf', 'adblue', 'injector', 'epb', 'service', 'sensors', 'actuators', 'ecu'] as const;

const COMPARE_ROWS = ['brands', 'classes', 'years', 'depth', 'users'] as const;

const STEPS = ['plugIn', 'install', 'start'] as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Marketing.why'});
    const alternates = buildAlternates(locale, '/warum-globeguard');

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

export default async function WarumGlobeGuardPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Marketing.why'});
    const tCommon = await getTranslations({locale, namespace: 'Marketing.common'});

    const compareColumns = [
        {key: 'basic', heading: 'BASIC', cta: {href: '/produkte/basic', label: t('compare.ctaBasic')}},
        {key: 'womo', heading: 'WoMo', cta: {href: '/produkte/womo', label: t('compare.ctaWomo')}},
        {key: 'pro', heading: 'PRO', cta: {href: '/produkte/pro', label: t('compare.ctaPro')}},
        {key: 'elite', heading: tCommon('eliteB2b'), cta: {href: '/produkte/elite', label: t('compare.ctaElite')}},
    ];

    const compareRows = COMPARE_ROWS.map((row) => ({
        key: row,
        label: t(`compare.rows.${row}.label`),
        cells: {
            basic: t(`compare.rows.${row}.basic`),
            womo: t(`compare.rows.${row}.womo`),
            pro: t(`compare.rows.${row}.pro`),
            elite: t(`compare.rows.${row}.elite`),
        },
    }));

    return (
        <main id="main-content" className="bg-slate-50">
            {/* Hero */}
            <section className="border-b border-slate-200 bg-slate-950 text-white">
                <div className="container mx-auto max-w-6xl px-4 py-16 lg:px-8 md:py-20">
                    <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                        {t('hero.titleLine1')}
                        <br />
                        <span className="text-primary">{t('hero.titleLine2')}</span>
                    </h1>
                    <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{t('hero.subtitle')}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/geraet-finden" className="btn-primary">
                            {t('hero.ctaPrimary')}
                        </Link>
                        <Link
                            href="/unterstuetzte-marken"
                            className="inline-flex items-center justify-center rounded-md border border-white/25 bg-white/10 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/20"
                        >
                            {t('hero.ctaSecondary')}
                        </Link>
                    </div>
                    <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-200">
                        {HERO_BADGES.map((badge) => (
                            <li key={badge} className="flex items-center gap-2">
                                <Check className="size-4 text-primary" aria-hidden="true" />
                                {t(`hero.badges.${badge}`)}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Three pillars */}
            <MarketingSection title={t('pillars.title')} subtitle={t('pillars.subtitle')}>
                <div className="grid gap-4 lg:grid-cols-3">
                    {PILLARS.map((pillar) => (
                        <article key={pillar.key} className="rounded-md border border-slate-200 bg-white p-6">
                            <h3 className="text-lg font-bold text-foreground">{t(`pillars.cards.${pillar.key}.title`)}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{t(`pillars.cards.${pillar.key}.text`)}</p>
                            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                                {pillar.items.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                                        <span>{t(`pillars.cards.${pillar.key}.items.${item}`)}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </MarketingSection>

            {/* Named workshop jobs */}
            <MarketingSection tone="alt" title={t('jobs.title')} subtitle={t('jobs.subtitle')}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {WORKSHOP_JOBS.map((job) => (
                        <article key={job} className="rounded-md border border-slate-200 bg-slate-50 p-5">
                            <h3 className="font-bold text-foreground">{t(`jobs.items.${job}.title`)}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{t(`jobs.items.${job}.text`)}</p>
                        </article>
                    ))}
                </div>
            </MarketingSection>

            {/* Tier comparison */}
            <MarketingSection title={t('compare.title')} subtitle={t('compare.subtitle')}>
                <TierComparisonTable
                    columns={compareColumns}
                    rows={compareRows}
                    featureAria={t('compare.featureAria')}
                    actionAria={t('compare.actionAria')}
                />
            </MarketingSection>

            {/* Getting started */}
            <MarketingSection tone="alt" title={t('steps.title')} subtitle={t('steps.subtitle')}>
                <ol className="grid gap-4 md:grid-cols-3">
                    {STEPS.map((step, index) => (
                        <li key={step} className="relative rounded-md border border-slate-200 bg-slate-50 p-6 pt-8">
                            <span className="absolute -top-4 left-6 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                {index + 1}
                            </span>
                            <h3 className="text-lg font-bold text-foreground">{t(`steps.cards.${step}.title`)}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{t(`steps.cards.${step}.text`)}</p>
                        </li>
                    ))}
                </ol>
            </MarketingSection>

            {/* Honesty band */}
            <MarketingSection tone="dark" title={t('honesty.title')} subtitle={t('honesty.text')}>
                <Link
                    href="/support/sgw"
                    className="inline-flex items-center justify-center rounded-md border border-white/25 bg-white/10 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/20"
                >
                    {t('honesty.cta')}
                </Link>
            </MarketingSection>
        </main>
    );
}
