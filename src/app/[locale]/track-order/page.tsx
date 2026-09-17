import type {Metadata} from 'next';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {buildAlternates} from '@/lib/metadata';
import {TrackOrderForm} from './track-order-form';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'TrackOrder'});
    return {
        title: t('pageTitle'),
        description: t('intro'),
        alternates: buildAlternates(locale, '/track-order'),
    };
}

/**
 * "Bestellung verfolgen" (/track-order).
 *
 * Skeleton only: the form collects order code + e-mail and shows a neutral
 * placeholder result. The actual lookup needs a backend resolver (an order
 * lookup by code + e-mail for non-logged-in customers) that does not exist yet.
 * TODO(backend): expose a shop-API resolver (e.g. `orderByCodeAndEmail`) and
 * wire it up in track-order-form.tsx via a server action.
 */
export default async function TrackOrderPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'TrackOrder'});

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
                    <p className="text-muted-foreground">{t('intro')}</p>
                </div>

                <TrackOrderForm />

                <p className="text-sm text-muted-foreground text-center">
                    {t('accountHint')}{' '}
                    <Link href="/account/orders" className="underline hover:text-primary">
                        {t('accountHintLink')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
