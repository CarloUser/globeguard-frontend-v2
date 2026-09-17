import type {Metadata} from 'next';
import {Download, FileText, Laptop, Mail, Smartphone, Wrench} from 'lucide-react';
import {getRouteLocale} from '@/i18n/server';
import {getGlobeguardContent} from '@/content/globeguard';
import {SITE_NAME, SITE_URL, buildCanonicalUrl} from '@/lib/metadata';
import {Link} from '@/i18n/navigation';

const pageCopy = {
    en: {
        title: 'Support and downloads',
        intro: 'Find update guidance, adapter instructions, manuals, and contact details for GlobeGuard diagnostic products.',
        resourcesTitle: 'Support topics',
        downloadsTitle: 'Downloads and guides',
        contactTitle: 'Need help with a vehicle?',
        contactBody: 'Send the vehicle brand, product, and problem description. Support can then confirm the correct next step.',
        contactCta: 'Contact support',
        view: 'View guide',
        request: 'Request',
        fileName: 'File name',
        type: 'Type',
        status: 'Status',
        action: 'Action',
        available: 'Available',
        guide: 'Guide',
        downloads: ['Update software', 'Remote diagnostics configuration', 'Quick-start guide', 'TRUMA cable adapter instructions', 'Iveco bypass cable instructions', 'VAG technical FAQ'],
    },
    de: {
        title: 'Support und Downloads',
        intro: 'Update-Hilfe, Adapter-Anleitungen, Handbuecher und Kontaktangaben fuer GlobeGuard Diagnoseprodukte.',
        resourcesTitle: 'Support-Themen',
        downloadsTitle: 'Downloads und Anleitungen',
        contactTitle: 'Hilfe zu einem Fahrzeug?',
        contactBody: 'Senden Sie Fahrzeugmarke, Produkt und Problembeschreibung. Der Support kann dann den naechsten Schritt bestaetigen.',
        contactCta: 'Support kontaktieren',
        view: 'Anleitung ansehen',
        request: 'Anfragen',
        fileName: 'Dateiname',
        type: 'Typ',
        status: 'Status',
        action: 'Aktion',
        available: 'Verfuegbar',
        guide: 'Anleitung',
        downloads: ['Software aktualisieren', 'Ferndiagnose konfigurieren', 'Schnellstart-Anleitung', 'TRUMA Adapterkabel Anleitung', 'Iveco Bypass-Kabel Anleitung', 'VAG technische FAQ'],
    },
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);

    return {
        metadataBase: new URL(SITE_URL),
        title: 'Support | ' + SITE_NAME,
        description: content.support.body,
        alternates: {
            canonical: buildCanonicalUrl('/' + locale + '/support'),
        },
    };
}

export default async function SupportPage() {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);
    const copy = locale === 'de' ? pageCopy.de : pageCopy.en;
    const supportIcons = [Laptop, Wrench, FileText, Smartphone];

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
                    <h2 className="mb-4 text-xl font-bold text-[#101820] dark:text-white">{copy.resourcesTitle}</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {content.support.resources.map((resource, index) => {
                            const Icon = supportIcons[index] ?? FileText;
                            return (
                                <Link key={resource.title} href="/contact" className="rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-primary dark:border-white/10 dark:bg-white/5">
                                    <div className="flex gap-3">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary dark:bg-white/10">
                                            <Icon className="size-5" />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold text-[#101820] dark:text-white">{resource.title}</h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.body}</p>
                                            <span className="mt-3 inline-flex text-sm font-semibold text-primary">{copy.view}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <h2 className="mb-4 text-xl font-bold text-[#101820] dark:text-white">{copy.downloadsTitle}</h2>
                    <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                                    <tr>
                                        <th className="p-3 font-semibold">{copy.fileName}</th>
                                        <th className="p-3 font-semibold">{copy.type}</th>
                                        <th className="p-3 font-semibold">{copy.status}</th>
                                        <th className="p-3 text-right font-semibold">{copy.action}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                                    {copy.downloads.map((item) => (
                                        <tr key={item} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Download className="size-4 text-slate-400" />
                                                    <span className="font-medium text-[#101820] dark:text-white">{item}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{copy.guide}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{copy.available}</td>
                                            <td className="p-3 text-right">
                                                <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">{copy.request}</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <section className="pb-10">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <div className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="font-bold text-[#101820] dark:text-white">{copy.contactTitle}</h2>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.contactBody}</p>
                            </div>
                            <Link href="/contact" className="btn-primary shrink-0">
                                <Mail className="mr-2 size-4" />
                                {copy.contactCta}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
