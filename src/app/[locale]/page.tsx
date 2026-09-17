import type {Metadata} from 'next';
import {ArrowRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {SITE_NAME, SITE_URL, buildAlternates} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const tHome = await getTranslations({locale, namespace: 'Home'});
    const tCommon = await getTranslations({locale, namespace: 'Common'});
    const ogLocale = toOgLocale(locale);
    const alternates = buildAlternates(locale, '/');
    const title = SITE_NAME + ' - ' + tHome('tagline');

    return {
        metadataBase: new URL(SITE_URL),
        title: {
            absolute: title,
        },
        description: tCommon('siteDescription'),
        alternates,
        openGraph: {
            title,
            description: tCommon('siteDescription'),
            type: 'website',
            locale: ogLocale,
            url: alternates.canonical,
        },
    };
}

/**
 * Minimal home page placeholder.
 *
 * Only the hero layout pattern (background image + dark-blue overlay + H1 + two CTAs)
 * is kept. All business sections (product families, comparison, testimonials, brand
 * lists, remote-diagnostics flow) were removed and will be rebuilt in Phase 2d from
 * the authoritative GlobeGuard content.
 */
export default async function Home() {
    const locale = await getRouteLocale();
    const tHome = await getTranslations({locale, namespace: 'Home'});
    const tNav = await getTranslations({locale, namespace: 'Navigation'});
    const tCommon = await getTranslations({locale, namespace: 'Common'});

    return (
        <main className="flex w-full flex-col bg-slate-50">
            <section
                className="relative overflow-hidden border-b border-slate-200 bg-slate-950 bg-cover bg-center bg-no-repeat pb-24 pt-32 text-white md:pb-28 md:pt-36"
                style={{backgroundImage: "url('/hero-banner-bg.jpg')"}}
            >
                <div className="absolute inset-0 bg-slate-950/75 mix-blend-multiply backdrop-blur-[1px]" />

                <div className="container relative z-10 mx-auto px-4 text-center lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-6">
                        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                            {tHome('tagline')}
                        </h1>

                        <div className="flex flex-wrap justify-center gap-4 pb-6 pt-2">
                            <Link
                                href="/geraet-finden"
                                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-[2px] hover:bg-primary/95"
                            >
                                {tNav('geraetFinden')}
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                            <Link
                                href="/produkte"
                                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:-translate-y-[2px] hover:bg-white/20"
                            >
                                {tNav('produkte')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20">
                <div className="container mx-auto px-4 text-center lg:px-8">
                    <p className="text-base text-slate-600">{tCommon('contentComingSoon')}</p>
                </div>
            </section>
        </main>
    );
}
