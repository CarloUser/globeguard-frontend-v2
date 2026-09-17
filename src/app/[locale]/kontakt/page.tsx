import type {Metadata} from 'next';
import {Mail, MapPin} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {globeguardCompany} from '@/content/globeguard';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Contact'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('title'),
        description: t('intro'),
        alternates: buildAlternates(locale, '/kontakt'),
    };
}

/**
 * Contact page shell: verified company block and an email link only.
 * No contact form (there is no submission handler yet) and no phone number
 * (not confirmed by the owner).
 */
export default async function KontaktPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Contact'});
    const {name, address, email, vat} = globeguardCompany;

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t('intro')}</p>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <div className="max-w-md rounded-md border border-slate-200 bg-white p-5">
                        <h2 className="font-bold text-foreground">{name}</h2>
                        <div className="mt-5 space-y-5 text-sm">
                            <div className="flex gap-3">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <div className="font-semibold text-foreground">{t('address')}</div>
                                    <address className="mt-1 not-italic leading-6 text-slate-600">
                                        {address.street}
                                        <br />
                                        {address.postalCode} {address.city}
                                        <br />
                                        {address.country}
                                    </address>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <div className="font-semibold text-foreground">{t('email')}</div>
                                    <a href={'mailto:' + email} className="mt-1 inline-flex text-primary hover:underline">
                                        {email}
                                    </a>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                {t('vat')} {vat}
                            </div>
                        </div>
                        <a href={'mailto:' + email} className="btn-primary mt-6 inline-flex">
                            <Mail className="mr-2 size-4" />
                            {t('writeEmail')}
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
