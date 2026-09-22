import type {Metadata} from 'next';
import {FileDown} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {BrandGroupCard} from '@/components/brands/brand-group-card';
import {BRAND_SECTIONS, brandGroupsForVehicleGroups} from '@/components/brands/brand-groups';
import {SUPPORTED_BRANDS_PDF} from '@/components/support/downloads';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {BASIC_FROM_YEAR, PRO_FROM_YEAR} from '@/lib/globeguard/picker';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'SupportedBrands'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('seoTitle'),
        description: t('seoDescription'),
        alternates: buildAlternates(locale, '/unterstuetzte-marken'),
    };
}

/**
 * Supported-brands overview: brand groups from brand-compatibility.json grouped by vehicle
 * class, logos from brand-logos.json (monogram fallback), tier badges and SGW notes.
 * Replaces the PDF as the primary compatibility reference; the PDF stays linked.
 */
export default async function SupportedBrandsPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'SupportedBrands'});

    const sections = BRAND_SECTIONS.map((section) => ({
        key: section.key,
        groups: brandGroupsForVehicleGroups(section.vehicleGroups),
    })).filter((section) => section.groups.length > 0);
    const totalGroups = sections.reduce((sum, section) => sum + section.groups.length, 0);

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                        {t('subtitle', {count: totalGroups, basicFromYear: BASIC_FROM_YEAR, proFromYear: PRO_FROM_YEAR})}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {t.rich('sgwNote', {
                            link: (chunks) => (
                                <Link href="/support/sgw" className="font-semibold text-primary hover:underline">
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                    <Link href="/geraet-finden" className="btn-primary mt-6">
                        {t('ctaFinder')}
                    </Link>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl space-y-10 px-4 lg:px-8">
                    {sections.map((section) => (
                        <div key={section.key}>
                            <h2 className="text-xl font-bold text-foreground">
                                {t(`sections.${section.key}`)}{' '}
                                <span className="text-sm font-normal text-slate-500">
                                    {t('groupCount', {count: section.groups.length})}
                                </span>
                            </h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {section.groups.map((group) => (
                                    <BrandGroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="rounded-md border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-600">
                            {t('pdfHint')}{' '}
                            <a
                                href={SUPPORTED_BRANDS_PDF}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center font-semibold text-primary hover:underline"
                            >
                                <FileDown className="mr-1.5 size-4" />
                                {t('pdfLink')}
                            </a>
                        </p>
                        <p className="mt-3 text-xs leading-5 text-slate-500">{t('trademark')}</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
