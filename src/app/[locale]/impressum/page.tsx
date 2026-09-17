import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {LegalPage} from '@/components/legal/legal-page';
import {globeguardCompany} from '@/content/globeguard';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

const SITE_DOMAIN = 'globeguard.ch';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Legal.impressum'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('title'),
        description: t('description'),
        alternates: buildAlternates(locale, '/impressum'),
    };
}

/**
 * Impressum with the verified company facts only (name, address, e-mail, VAT number).
 * Managing director and commercial register entry are placeholders until the owner
 * supplies them (decision B12).
 */
export default async function ImpressumPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Legal.impressum'});
    const {name, address, email, vat} = globeguardCompany;

    const toc = [
        {id: 'unternehmen', label: t('sections.company')},
        {id: 'kontakt', label: t('sections.contact')},
        {id: 'geschaeftsfuehrung', label: t('sections.management')},
        {id: 'handelsregister', label: t('sections.register')},
        {id: 'mehrwertsteuer', label: t('sections.vat')},
    ];

    return (
        <LegalPage locale={locale} title={t('title')} description={t('description')} toc={toc}>
            <h2 id="unternehmen">{t('sections.company')}</h2>
            <p>
                <strong>{name}</strong>
                <br />
                {t('operator')}
            </p>
            <address className="mb-4 not-italic">
                {address.street}
                <br />
                {address.postalCode} {address.city}
                <br />
                {address.country}
            </address>

            <h2 id="kontakt">{t('sections.contact')}</h2>
            <p>
                {t('email')}: <a href={'mailto:' + email}>{email}</a>
                <br />
                {t('website')}: <a href={'https://' + SITE_DOMAIN}>{SITE_DOMAIN}</a>
            </p>

            <h2 id="geschaeftsfuehrung">{t('sections.management')}</h2>
            <p>{t('managementPlaceholder')}</p>

            <h2 id="handelsregister">{t('sections.register')}</h2>
            <p>{t('registerPlaceholder')}</p>

            <h2 id="mehrwertsteuer">{t('sections.vat')}</h2>
            <p>
                {t('vatLabel')}: {vat}
            </p>
        </LegalPage>
    );
}
