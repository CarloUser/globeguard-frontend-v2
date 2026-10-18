import {SITE_NAME, SITE_URL, buildCanonicalUrl} from '@/lib/metadata';
import type {BlogCard, BlogDetail, BlogFaqItem} from '@/lib/vendure/blog';
import {buildBlogExcerpt, normalizeBlogTags, stripHtml} from './content';
import {toIsoDate} from './date';
import {blogPostHref} from './slug';

/**
 * JSON-LD builders for the blog (ported from the old services/seo/structured-data.ts and
 * reduced to the schema.org types the blog actually needs). All URLs must be absolute; callers
 * pass the locale-aware canonical URLs they already computed for the page metadata.
 */

export type JsonLd = Record<string, unknown>;

const LOGO_PATH = '/globeguard-logo-navy.png';

function publisher(): JsonLd {
    return {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
            '@type': 'ImageObject',
            url: buildCanonicalUrl(LOGO_PATH),
        },
    };
}

export function toAbsoluteUrl(value?: string | null): string | undefined {
    if (!value) {
        return undefined;
    }
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    return buildCanonicalUrl(value);
}

export interface BreadcrumbEntry {
    name: string;
    url: string;
}

export function buildBreadcrumbJsonLd(entries: readonly BreadcrumbEntry[]): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: entries.map((entry, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: entry.name,
            item: entry.url,
        })),
    };
}

export interface BlogListingJsonLdInput {
    title: string;
    description: string;
    url: string;
    posts: readonly BlogCard[];
    /** Absolute URL (active locale) for a locale-agnostic post href such as `/blog/<base slug>`. */
    postUrl: (href: string) => string;
}

export function buildBlogListingJsonLd(input: BlogListingJsonLdInput): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: input.title,
        description: input.description,
        url: input.url,
        publisher: publisher(),
        blogPost: input.posts.slice(0, 10).map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: input.postUrl(blogPostHref(post)),
            datePublished: toIsoDate(post.publishedAt),
            author: {'@type': 'Organization', name: SITE_NAME},
            image: toAbsoluteUrl(post.featuredImage?.preview),
            description: buildBlogExcerpt(post),
        })),
    };
}

export interface BlogPostingJsonLdInput {
    post: BlogDetail;
    url: string;
    description: string;
    image?: string | null;
    /** BCP-47 language of the rendered translation, e.g. de-CH. */
    inLanguage: string;
}

/**
 * BlogPosting (a subtype of Article) for the post page. The author is the named person when
 * the backend has one, otherwise the company.
 */
export function buildBlogPostingJsonLd({post, url, description, image, inLanguage}: BlogPostingJsonLdInput): JsonLd {
    const author = post.author?.trim();
    const keywords = normalizeBlogTags(post.metaTags);

    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.metaTitle || post.title,
        description,
        url,
        mainEntityOfPage: {'@type': 'WebPage', '@id': url},
        image: toAbsoluteUrl(image) ? [toAbsoluteUrl(image)] : undefined,
        datePublished: toIsoDate(post.publishedAt) ?? toIsoDate(post.createdAt),
        dateModified: toIsoDate(post.updatedAt) ?? toIsoDate(post.publishedAt),
        author: author ? {'@type': 'Person', name: author} : {'@type': 'Organization', name: SITE_NAME},
        publisher: publisher(),
        ...(keywords.length > 0 && {keywords: keywords.join(', ')}),
        ...(post.readingTime && {timeRequired: `PT${Math.max(1, Math.round(post.readingTime))}M`}),
        inLanguage,
    };
}

export function buildFaqPageJsonLd(items: readonly BlogFaqItem[]): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: stripHtml(item.answerHtml),
            },
        })),
    };
}

/**
 * The backend may store editor-supplied JSON-LD on a post (`structuredData`). Accept an object or
 * an array of objects; anything else is ignored so a malformed value cannot break the page.
 */
export function parseBackendStructuredData(value?: string | null): JsonLd[] {
    if (!value) {
        return [];
    }
    try {
        const parsed: unknown = JSON.parse(value);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        return list.filter((entry): entry is JsonLd => typeof entry === 'object' && entry !== null && !Array.isArray(entry));
    } catch {
        return [];
    }
}
