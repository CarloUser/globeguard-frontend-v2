import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Partners'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('title'),
        description: t('comingSoon'),
        alternates: buildAlternates(locale, '/partner'),
    };
}

/**
 * Partner page shell.
 *
 * The partner list is intentionally empty. Partner data will be provided by the
 * backend store-locator plugin (StoreLocatorPlugin) and rendered here in a later
 * phase; no partners are hardcoded in the frontend.
 */
export default async function PartnerPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Partners'});

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <div className="rounded-md border border-slate-200 bg-white p-5">
                        <p className="text-sm leading-6 text-slate-600">{t('comingSoon')}</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
