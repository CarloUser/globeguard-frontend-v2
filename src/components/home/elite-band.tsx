import {ArrowRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

interface EliteBandProps {
    locale: string;
}

/** B2B band: GlobeGuard ELITE for workshops and businesses, linking to /produkte/elite. */
export async function EliteBand({locale}: EliteBandProps) {
    const [t, tCommon] = await Promise.all([
        getTranslations({locale, namespace: 'HomePage.b2b'}),
        getTranslations({locale, namespace: 'Marketing.common'}),
    ]);

    return (
        <section className="bg-slate-950 py-12 text-white md:py-16">
            <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div>
                        <span className="text-mono-label mb-4 inline-flex rounded-sm bg-white px-2 py-1 text-slate-900">
                            {tCommon('badgeB2b')}
                        </span>
                        <h2 className="text-2xl font-bold text-white md:text-3xl">{t('title')}</h2>
                        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{t('subtitle')}</p>
                    </div>
                    <div className="lg:justify-self-end">
                        <Link
                            href="/produkte/elite"
                            className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-bold text-slate-900 shadow-md transition-all hover:-translate-y-[2px] hover:bg-slate-100"
                        >
                            {t('cta')}
                            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
