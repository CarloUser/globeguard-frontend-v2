import {ArrowRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

interface HomeHeroProps {
    locale: string;
}

/**
 * Home hero: background image + dark overlay (the storefront's hero pattern), the brand
 * tagline as H1, the approved subtitle, two CTAs (device finder / products) and the three
 * proof items from the previous storefront's home page.
 */
export async function HomeHero({locale}: HomeHeroProps) {
    const [t, tHome] = await Promise.all([
        getTranslations({locale, namespace: 'HomePage.hero'}),
        getTranslations({locale, namespace: 'Home'}),
    ]);

    const proofItems = [
        {label: t('proof.tiersLabel'), value: t('proof.tiersValue')},
        {label: t('proof.classesLabel'), value: t('proof.classesValue')},
        {label: t('proof.shippingLabel'), value: t('proof.shippingValue')},
    ];

    return (
        <section
            className="relative overflow-hidden border-b border-slate-200 bg-slate-950 bg-cover bg-center bg-no-repeat pb-20 pt-32 text-white md:pb-24 md:pt-36"
            style={{backgroundImage: "url('/hero-banner-bg.jpg')"}}
        >
            <div className="absolute inset-0 bg-slate-950/75 mix-blend-multiply backdrop-blur-[1px]" />

            <div className="container relative z-10 mx-auto px-4 text-center lg:px-8">
                <div className="mx-auto max-w-4xl space-y-6">
                    <p className="text-mono-label text-slate-300">{t('eyebrow')}</p>
                    <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                        {tHome('tagline')}
                    </h1>
                    <p className="mx-auto max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{t('subtitle')}</p>

                    <div className="flex flex-wrap justify-center gap-4 pb-2 pt-2">
                        <Link
                            href="/geraet-finden"
                            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-[2px] hover:bg-primary/95"
                        >
                            {t('ctaFinder')}
                            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                        </Link>
                        <Link
                            href="/produkte"
                            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:-translate-y-[2px] hover:bg-white/20"
                        >
                            {t('ctaProducts')}
                        </Link>
                    </div>

                    <ul
                        className="mx-auto grid max-w-3xl gap-3 pt-6 text-left sm:grid-cols-3"
                        aria-label={t('proofAria')}
                    >
                        {proofItems.map((item) => (
                            <li key={item.label} className="rounded-md border border-white/15 bg-white/5 px-4 py-3">
                                <strong className="block text-sm font-bold text-white">{item.label}</strong>
                                <span className="block text-xs leading-5 text-slate-300">{item.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
