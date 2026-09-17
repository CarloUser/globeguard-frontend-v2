import {getTranslations} from 'next-intl/server';
import {LegalFactList, createPendingLegalPage} from '@/components/legal/pending-legal-page';

/**
 * Verified facts only (DECISIONS.md A5 / O5): online payment via Mollie (TWINT, card,
 * PostFinance, Apple Pay, PayPal) and purchase on account for approved business customers.
 * The full text is pending (owner decision B12).
 */
const {generateMetadata, PendingLegalPage} = createPendingLegalPage({
    key: 'zahlungsarten',
    href: '/zahlungsarten',
    facts: async (locale) => {
        const t = await getTranslations({locale, namespace: 'Legal.zahlungsarten'});
        return (
            <LegalFactList
                heading={t('factsHeading')}
                items={[
                    {title: t('facts.online.title'), text: t('facts.online.text')},
                    {title: t('facts.invoice.title'), text: t('facts.invoice.text')},
                ]}
            />
        );
    },
});

export {generateMetadata};
export default PendingLegalPage;
