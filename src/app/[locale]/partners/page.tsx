import type {Metadata} from 'next';
import {CheckCircle2, Mail, MapPin, Phone} from 'lucide-react';
import {getRouteLocale} from '@/i18n/server';
import {getGlobeguardContent} from '@/content/globeguard';
import {SITE_NAME, SITE_URL, buildCanonicalUrl} from '@/lib/metadata';
import {Link} from '@/i18n/navigation';

const pageCopy = {
    en: {
        title: 'Partner workshops',
        intro: 'GlobeGuard can work with local workshops and remote diagnostics partners when a vehicle needs help away from home.',
        situations: 'Typical support situations',
        network: 'Current partner list',
        partnerType: 'Diagnostics partner',
        contact: 'Contact',
        route: 'Location',
        questionTitle: 'Want to add or confirm a partner?',
        questionBody: 'Send the workshop name, country, and contact details so the listing can be verified before it appears publicly.',
        questionCta: 'Send partner details',
    },
    de: {
        title: 'Partnerwerkstaetten',
        intro: 'GlobeGuard kann mit lokalen Werkstaetten und Ferndiagnose-Partnern arbeiten, wenn ein Fahrzeug unterwegs Hilfe braucht.',
        situations: 'Typische Support-Situationen',
        network: 'Aktuelle Partnerliste',
        partnerType: 'Diagnosepartner',
        contact: 'Kontakt',
        route: 'Standort',
        questionTitle: 'Partner hinzufuegen oder bestaetigen?',
        questionBody: 'Senden Sie Werkstattname, Land und Kontaktdaten, damit der Eintrag vor der Veroeffentlichung geprueft werden kann.',
        questionCta: 'Partnerdaten senden',
    },
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);

    return {
        metadataBase: new URL(SITE_URL),
        title: 'Partners | ' + SITE_NAME,
        description: content.partners.title,
        alternates: {
            canonical: buildCanonicalUrl('/' + locale + '/partners'),
        },
    };
}

export default async function PartnersPage() {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);
    const copy = locale === 'de' ? pageCopy.de : pageCopy.en;

    return (
        <main className="bg-slate-50 pt-32 dark:bg-[#101820]">
            <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#101820]">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-[#101820] dark:text-white md:text-4xl">{copy.title}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{copy.intro}</p>
                </div>
            </section>

            <section className="border-b border-slate-200 bg-white py-8 dark:border-white/10 dark:bg-[#101820]">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <h2 className="mb-4 text-xl font-bold text-[#101820] dark:text-white">{copy.situations}</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {content.partners.situations.map((item) => (
                            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                                <CheckCircle2 className="mb-3 size-5 text-primary" />
                                <p className="text-sm font-medium leading-6 text-[#101820] dark:text-white">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                    <div>
                        <h2 className="mb-4 text-xl font-bold text-[#101820] dark:text-white">{copy.network}</h2>
                        <div className="grid gap-3">
                            {content.partners.partners.map((partner) => (
                                <div key={partner.country + partner.name} className="rounded-md border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-semibold text-[#101820] dark:text-white">{partner.name}</h3>
                                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <MapPin className="size-4 text-primary" />
                                                <span>{partner.detail}, {partner.country}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-sm">
                                            <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 dark:border-white/10 dark:text-slate-300">{copy.partnerType}</span>
                                            <Link href="/contact" className="rounded-md bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary/90">{copy.contact}</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <h2 className="font-bold text-[#101820] dark:text-white">{copy.questionTitle}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.questionBody}</p>
                        <Link href="/contact" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                            <Mail className="mr-2 size-4" />
                            {copy.questionCta}
                        </Link>
                        <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                                <Phone className="size-4 text-primary" />
                                {content.contact.phone}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
