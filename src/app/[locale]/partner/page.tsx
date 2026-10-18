import type {Metadata} from 'next';
import {ArrowLeft, MapPinOff} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {PartnerLocationCard} from '@/components/support/partner-location-card';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';
import {getStoreLocations, groupStoreLocationsByType} from '@/lib/vendure/store-locator';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'PartnerLocator'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('seoTitle'),
        description: t('seoDescription'),
        alternates: buildAlternates(locale, '/partner'),
    };
}

/**
 * Partner workshops / points of sale from the backend store-locator plugin
 * (`storeLocations`, published only). Grouped by type; an empty list renders the
 * "published shortly" state. No map yet (Leaflet map is a follow-up); nothing is
 * hardcoded in the frontend.
 */
export default async function PartnerPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'PartnerLocator'});
    const locations = await getStoreLocations();
    const groups = groupStoreLocationsByType(locations);

    return (
        <main id="main-content" className="bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <Link href="/support" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                        <ArrowLeft className="mr-1.5 size-4" />
                        {t('backToSupport')}
                    </Link>
                    <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t('intro')}</p>
                    {locations.length > 0 && (
                        <p className="mt-2 text-sm text-slate-500">{t('total', {count: locations.length})}</p>
                    )}
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl space-y-10 px-4 lg:px-8">
                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center rounded-md border border-slate-200 bg-white px-5 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-md bg-slate-100 text-primary">
                                <MapPinOff className="size-6" />
                            </span>
                            <p className="mt-4 text-sm leading-6 text-slate-600">{t('empty')}</p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.type}>
                                <h2 className="text-xl font-bold text-foreground">
                                    {t(`groups.${group.type}`)}{' '}
                                    <span className="text-sm font-normal text-slate-500">
                                        {t('total', {count: group.items.length})}
                                    </span>
                                </h2>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {group.items.map((location) => (
                                        <PartnerLocationCard key={location.id} location={location} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}

                    <div className="rounded-md border border-slate-200 bg-white p-5">
                        <h2 className="font-semibold text-foreground">{t('contact.title')}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{t('contact.text')}</p>
                        <Link href="/kontakt" className="btn-secondary mt-4 text-sm">
                            {t('contact.button')}
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
