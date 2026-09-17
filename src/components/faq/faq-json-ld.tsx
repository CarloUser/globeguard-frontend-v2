import {buildFaqPageJsonLd, shouldEmitFaqSchema, type SitePageFaq} from '@/lib/vendure/faq';

interface FaqJsonLdProps {
    section: SitePageFaq | null;
    pageKey: string;
}

/** FAQPage structured data; renders nothing unless `shouldEmitFaqSchema` holds. */
export function FaqJsonLd({section, pageKey}: FaqJsonLdProps) {
    if (!shouldEmitFaqSchema(section, pageKey)) {
        return null;
    }
    // Escape "<" so that a "</script>" inside an answer cannot terminate the script element.
    const json = JSON.stringify(buildFaqPageJsonLd(section)).replace(/</g, '\\u003c');
    return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />;
}
