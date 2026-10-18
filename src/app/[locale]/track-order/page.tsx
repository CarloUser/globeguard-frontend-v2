import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {buildAlternates, noIndexRobots} from '@/lib/metadata';
import {TrackOrderForm} from './track-order-form';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Tracking'});
    return {
        title: t('pageTitle'),
        description: t('intro'),
        alternates: buildAlternates(locale, '/track-order'),
        // Utility page (noindex in the previous storefront as well); it stays in the sitemap
        // only as a low-priority entry.
        robots: noIndexRobots(),
    };
}

/**
 * "Bestellung verfolgen" (/track-order): order code + e-mail lookup via the shop API
 * `trackOrder` query (src/lib/vendure/order-tracking.ts) through a server action.
 */
export default async function TrackOrderPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Tracking'});

    return (
        <main id="main-content" className="bg-slate-50">
            <div className="container mx-auto px-4 pb-16 pt-10">
                <div className="mx-auto max-w-xl space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold text-foreground">{t('pageTitle')}</h1>
                        <p className="text-muted-foreground">{t('intro')}</p>
                    </div>

                    <TrackOrderForm />

                    <p className="text-center text-sm text-muted-foreground">
                        {t('accountHint')}{' '}
                        <Link href="/account/orders" className="underline hover:text-primary">
                            {t('accountHintLink')}
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
