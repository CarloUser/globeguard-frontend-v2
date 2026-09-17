import type {Metadata} from 'next';
import {ArrowLeft, Cable, KeyRound} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {SgwCompatibilityTable} from '@/components/support/sgw-compatibility-table';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {
    BASIC_FROM_YEAR,
    PRO_FROM_YEAR,
    SGW_CABLE_SKUS,
    SGW_LICENSE_DURATIONS,
    SGW_LICENSE_SKUS,
    localizedLabel,
    skuToProductSlug,
} from '@/lib/globeguard/picker';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

const LICENSE_GROUPS = ['stellantis', 'mercedes', 'vag'] as const;
const CABLES = [
    {key: 'fcca', sku: SGW_CABLE_SKUS.FCCA},
    {key: 'ive', sku: SGW_CABLE_SKUS.IVE},
] as const;

// TODO(Phase 2c): repoint to /produkte/kategorie/[slug] once that route exists
// (or add a permanent redirect from /collection/*).
const LICENSES_COLLECTION_HREF = '/collection/sgw-license';
const CABLES_COLLECTION_HREF = '/collection/sgw-bypass';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'SupportHub.sgw'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('seoTitle'),
        description: t('seoDescription'),
        alternates: buildAlternates(locale, '/support/sgw'),
    };
}

/**
 * SGW compatibility overview: explanatory copy, the brand-group table generated from
 * brand-compatibility.json, and links to the licence and bypass-cable products.
 */
export default async function SgwSupportPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'SupportHub.sgw'});
    const durations = SGW_LICENSE_DURATIONS.map((duration) => localizedLabel(duration, locale)).join(' · ');

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <Link href="/support" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                        <ArrowLeft className="mr-1.5 size-4" />
                        {t('backToSupport')}
                    </Link>
                    <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t('subtitle')}</p>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <SgwCompatibilityTable />
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        {t('note', {proFromYear: PRO_FROM_YEAR, basicFromYear: BASIC_FROM_YEAR})}
                    </p>

                    <div className="mt-8 grid gap-3 md:grid-cols-2">
                        <div className="flex flex-col rounded-md border border-slate-200 bg-white p-5">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
                                <KeyRound className="size-5" />
                            </span>
                            <h2 className="mt-4 font-semibold text-foreground">{t('licensesTitle')}</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{t('licensesText')}</p>
                            <p className="mt-2 text-xs text-slate-500">
                                {t('durationsLabel')}: {durations}
                            </p>
                            <ul className="mt-4 space-y-1.5 text-sm">
                                {LICENSE_GROUPS.map((group) => (
                                    <li key={group}>
                                        <Link
                                            href={`/products/${skuToProductSlug(SGW_LICENSE_SKUS[group])}`}
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            {t(`licenseProducts.${group}`)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-auto pt-5">
                                <Link href={LICENSES_COLLECTION_HREF} className="btn-primary text-sm">
                                    {t('licensesAll')}
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col rounded-md border border-slate-200 bg-white p-5">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
                                <Cable className="size-5" />
                            </span>
                            <h2 className="mt-4 font-semibold text-foreground">{t('cablesTitle')}</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{t('cablesText')}</p>
                            <ul className="mt-4 space-y-1.5 text-sm">
                                {CABLES.map((cable) => (
                                    <li key={cable.key}>
                                        <Link
                                            href={`/products/${skuToProductSlug(cable.sku)}`}
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            {t(`cableProducts.${cable.key}`)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-auto pt-5">
                                <Link href={CABLES_COLLECTION_HREF} className="btn-primary text-sm">
                                    {t('cablesAll')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
