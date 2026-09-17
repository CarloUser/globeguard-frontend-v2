import {ArrowRight, Search} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';

const copy = {
    en: {
        label: 'Diagnostic catalog',
        title: 'GlobeGuard diagnostic tools and software',
        body: 'Choose the right diagnostic interface, adapter, software license, or support option from the imported catalog.',
        primary: 'Open catalog',
        secondary: 'Support guides',
    },
    de: {
        label: 'Diagnosekatalog',
        title: 'GlobeGuard Diagnosegeraete und Software',
        body: 'Passendes Diagnose-Interface, Adapter, Softwarelizenz oder Support-Option aus dem importierten Katalog waehlen.',
        primary: 'Katalog oeffnen',
        secondary: 'Support lesen',
    },
} as const;

export async function HeroSection() {
    const locale = await getRouteLocale();
    const text = locale === 'de' ? copy.de : copy.en;

    return (
        <section className="border-b border-slate-200 bg-white px-4 pb-10 pt-32 dark:border-white/10 dark:bg-[#101820] lg:px-8">
            <div className="container mx-auto max-w-5xl py-10">
                <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase text-slate-600 dark:border-white/10 dark:text-slate-300">
                    <Search className="size-4 text-primary" />
                    {text.label}
                </div>
                <h1 className="max-w-3xl text-3xl font-bold leading-tight text-[#101820] dark:text-white md:text-5xl">{text.title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{text.body}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/search" className="btn-primary">
                        {text.primary}
                        <ArrowRight className="ml-2 size-4" />
                    </Link>
                    <Link href="/support" className="btn-secondary">{text.secondary}</Link>
                </div>
            </div>
        </section>
    );
}
