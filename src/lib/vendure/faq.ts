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
                group
                groupTitle
                groupIntro
                slug
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

/** Owner key the backend assigns to a blog post section by default (`blog:<base slug>`). */
export function blogFaqOwnerKey(slug: string): string {
    return `blog:${slug.trim().replace(/^\/+|\/+$/g, '')}`;
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

/** The fields the schema gate needs; satisfied by site-page and blog FAQ sections alike. */
export interface FaqSchemaCandidate {
    items: readonly unknown[];
    schemaEnabled: boolean;
    canonicalOwnerKey: string | null;
}

/**
 * FAQPage JSON-LD is emitted only when the section has items, the editor enabled schema output
 * and the rendering page is the canonical owner of the section (duplicated sections on other
 * pages must not repeat the schema). `expectedOwnerKey` is the page's own key, built with
 * `siteFaqOwnerKey(pageKey)` or `blogFaqOwnerKey(slug)`.
 */
export function shouldEmitFaqSchema<T extends FaqSchemaCandidate>(section: T | null, expectedOwnerKey: string): section is T {
    return (
        !!section &&
        section.items.length > 0 &&
        section.schemaEnabled &&
        section.canonicalOwnerKey === expectedOwnerKey
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
