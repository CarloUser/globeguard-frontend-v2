import {getTranslations} from 'next-intl/server';
import {LegalFactList, createPendingLegalPage} from '@/components/legal/pending-legal-page';

/**
 * Verified facts only, taken from the approved BlockBenefits copy of the previous storefront:
 * shipping to Switzerland and Liechtenstein from Cham, EU/worldwide deliveries from the German
 * warehouse (customs note). No delivery-time promises. The full text is pending (B12).
 */
const {generateMetadata, PendingLegalPage} = createPendingLegalPage({
    key: 'versand',
    href: '/versand',
    facts: async (locale) => {
        const t = await getTranslations({locale, namespace: 'Legal.versand'});
        return (
            <LegalFactList
                heading={t('factsHeading')}
                items={[
                    {title: t('facts.switzerland.title'), text: t('facts.switzerland.text')},
                    {title: t('facts.eu.title'), text: t('facts.eu.text')},
                ]}
            />
        );
    },
});

export {generateMetadata};
export default PendingLegalPage;
