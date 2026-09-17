import type {Metadata} from 'next';
import {Clock, Mail, MapPin, Phone, Send} from 'lucide-react';
import {getRouteLocale} from '@/i18n/server';
import {getGlobeguardContent} from '@/content/globeguard';
import {SITE_NAME, SITE_URL, buildCanonicalUrl} from '@/lib/metadata';

const pageCopy = {
    en: {
        title: 'Contact GlobeGuard',
        address: 'Address',
        email: 'Email',
        phone: 'Phone',
        hours: 'Business hours',
        hoursValue: 'Mon-Fri: 08:00-17:00 CET',
        formTitle: 'Send an inquiry',
        firstName: 'First name',
        lastName: 'Last name',
        emailAddress: 'Email address',
        subject: 'Subject',
        message: 'Message',
        submit: 'Send message',
        placeholders: {
            firstName: 'First name',
            lastName: 'Last name',
            email: 'name@example.com',
            message: 'Vehicle brand, product, and short problem description',
        },
        subjects: ['Technical support', 'Sales inquiry', 'Partner workshop', 'Other'],
    },
    de: {
        title: 'GlobeGuard kontaktieren',
        address: 'Adresse',
        email: 'E-Mail',
        phone: 'Telefon',
        hours: 'Geschaeftszeiten',
        hoursValue: 'Mo-Fr: 08:00-17:00 CET',
        formTitle: 'Anfrage senden',
        firstName: 'Vorname',
        lastName: 'Nachname',
        emailAddress: 'E-Mail-Adresse',
        subject: 'Betreff',
        message: 'Nachricht',
        submit: 'Nachricht senden',
        placeholders: {
            firstName: 'Vorname',
            lastName: 'Nachname',
            email: 'name@example.com',
            message: 'Fahrzeugmarke, Produkt und kurze Problembeschreibung',
        },
        subjects: ['Technischer Support', 'Verkaufsanfrage', 'Partnerwerkstatt', 'Sonstiges'],
    },
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);

    return {
        metadataBase: new URL(SITE_URL),
        title: 'Contact | ' + SITE_NAME,
        description: content.contact.subtitle,
        alternates: {
            canonical: buildCanonicalUrl('/' + locale + '/contact'),
        },
    };
}

export default async function ContactPage() {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);
    const copy = locale === 'de' ? pageCopy.de : pageCopy.en;

    return (
        <main className="bg-slate-50 pt-32 dark:bg-[#101820]">
            <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#101820]">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-[#101820] dark:text-white md:text-4xl">{copy.title}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{content.contact.subtitle}</p>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
                    <aside className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <h2 className="font-bold text-[#101820] dark:text-white">{content.contact.title}</h2>
                        <div className="mt-5 space-y-5 text-sm">
                            <div className="flex gap-3">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <div className="font-semibold text-[#101820] dark:text-white">{copy.address}</div>
                                    <div className="mt-1 leading-6 text-slate-600 dark:text-slate-300">
                                        {content.contact.address.map((line) => <span key={line}>{line}<br /></span>)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <div className="font-semibold text-[#101820] dark:text-white">{copy.email}</div>
                                    <a href={'mailto:' + content.contact.email} className="mt-1 inline-flex text-primary hover:underline">{content.contact.email}</a>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <div className="font-semibold text-[#101820] dark:text-white">{copy.phone}</div>
                                    <div className="mt-1 text-slate-600 dark:text-slate-300">{content.contact.phone}</div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <div className="font-semibold text-[#101820] dark:text-white">{copy.hours}</div>
                                    <div className="mt-1 text-slate-600 dark:text-slate-300">{copy.hoursValue}</div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5 md:p-6">
                        <h2 className="mb-5 text-xl font-bold text-[#101820] dark:text-white">{copy.formTitle}</h2>
                        <form className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="contact-first-name" className="text-sm font-semibold text-[#101820] dark:text-white">{copy.firstName}</label>
                                    <input id="contact-first-name" type="text" className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#101820]" placeholder={copy.placeholders.firstName} />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="contact-last-name" className="text-sm font-semibold text-[#101820] dark:text-white">{copy.lastName}</label>
                                    <input id="contact-last-name" type="text" className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#101820]" placeholder={copy.placeholders.lastName} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="contact-email" className="text-sm font-semibold text-[#101820] dark:text-white">{copy.emailAddress}</label>
                                <input id="contact-email" type="email" className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#101820]" placeholder={copy.placeholders.email} />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="contact-subject" className="text-sm font-semibold text-[#101820] dark:text-white">{copy.subject}</label>
                                <select id="contact-subject" className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#101820] dark:text-slate-200">
                                    {copy.subjects.map((subject) => <option key={subject}>{subject}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="contact-message" className="text-sm font-semibold text-[#101820] dark:text-white">{copy.message}</label>
                                <textarea id="contact-message" className="h-32 w-full resize-none rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#101820]" placeholder={copy.placeholders.message}></textarea>
                            </div>

                            <button type="submit" className="btn-primary w-full sm:w-auto">
                                <Send className="mr-2 size-4" />
                                {copy.submit}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
