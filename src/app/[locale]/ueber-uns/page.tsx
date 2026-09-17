import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {LegalPage} from '@/components/legal/legal-page';
import {globeguardCompany} from '@/content/globeguard';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Legal.ueberUns'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates(locale, '/ueber-uns'),
    };
}

/**
 * About page shell: company name, tagline and the verified contact block. The previous
 * storefront's about text was Drivknuten copy and is intentionally not ported; the
 * GlobeGuard text is pending.
 */
export default async function UeberUnsPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Legal.ueberUns'});
    const tHome = await getTranslations({locale, namespace: 'Home'});

    return (
        <LegalPage locale={locale} title={t('title')} description={tHome('tagline')}>
            <h2>{globeguardCompany.name}</h2>
            <p>{t('description')}</p>
            <p>{t('contentComing')}</p>
        </LegalPage>
    );
}
