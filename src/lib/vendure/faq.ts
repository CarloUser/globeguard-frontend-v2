import {cache} from 'react';
import {graphql, type ResultOf} from '@/graphql';
import {query} from '@/lib/vendure/api';

/**
 * Published FAQ section of a static site page (FAQ plugin, `sitePageFaq`). The backend resolves
 * the section in the request language (`languageCode` query parameter) and returns `null`
 * when the page key is unknown or no published section exists in that language.
 */
export const GetSitePageFaqQuery = graphql(`
    query GetSitePageFaq($pageKey: String!) {
        sitePageFaq(pageKey: $pageKey) {
            title
            intro
            schemaEnabled
            canonicalOwnerKey
            lastReviewedAt
            items {
                question
                answerHtml
                sortOrder
            }
        }
    }
`);

export type SitePageFaq = NonNullable<ResultOf<typeof GetSitePageFaqQuery>['sitePageFaq']>;
export type SitePageFaqItem = SitePageFaq['items'][number];

/** Owner key the backend assigns to a site page section by default (`site:<pageKey>`). */
export function siteFaqOwnerKey(pageKey: string): string {
    return `site:${pageKey.trim().replace(/^\/+|\/+$/g, '')}`;
}

/**
 * Published FAQ section of `pageKey` (e.g. "faq", "support", "produkte-basic") in `locale`,
 * items sorted by `sortOrder`, or `null` when there is none. Wrapped in React `cache()` so
 * the page metadata and body of one request share a single shop-API round-trip.
 */
export const getSitePageFaq = cache(async (pageKey: string, locale: string): Promise<SitePageFaq | null> => {
    const result = await query(GetSitePageFaqQuery, {pageKey}, {languageCode: locale});
    const section = result.data.sitePageFaq;
    if (!section) {
        return null;
    }
    return {
        ...section,
        items: [...section.items].sort((a, b) => a.sortOrder - b.sortOrder),
    };
});

/**
 * FAQPage JSON-LD is emitted only when the section has items, the editor enabled schema output
 * and this page is the canonical owner of the section (duplicated sections on other pages must
 * not repeat the schema).
 */
export function shouldEmitFaqSchema(section: SitePageFaq | null, pageKey: string): section is SitePageFaq {
    return (
        !!section &&
        section.items.length > 0 &&
        section.schemaEnabled &&
        section.canonicalOwnerKey === siteFaqOwnerKey(pageKey)
    );
}

export function buildFaqPageJsonLd(section: SitePageFaq) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: section.items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answerHtml,
            },
        })),
    };
}
