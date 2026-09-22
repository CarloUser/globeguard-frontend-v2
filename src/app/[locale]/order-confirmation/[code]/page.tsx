import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {OrderConfirmation} from './order-confirmation';
import {buildAlternates, noIndexRobots} from '@/lib/metadata';

export async function generateMetadata({params}: PageProps<'/[locale]/order-confirmation/[code]'>): Promise<Metadata> {
    const {code} = await params;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'OrderConfirmation'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
        alternates: buildAlternates(locale, `/order-confirmation/${code}`),
    };
}

export default function OrderConfirmationPage(props: PageProps<'/[locale]/order-confirmation/[code]'>) {
    // No Suspense boundary around OrderConfirmation: a boundary here would flush a 200 shell
    // before its notFound() runs, turning unknown or foreign order codes into soft 404s
    // (see [locale]/layout.tsx and products/[slug]/page.tsx).
    return <OrderConfirmation paramsPromise={props.params} />;
}
