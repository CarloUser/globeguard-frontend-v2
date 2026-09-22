import {cache} from 'react';
import {graphql, type ResultOf} from '@/graphql';
import {blogBaseSlug} from '@/lib/blog/slug';
import {query} from '@/lib/vendure/api';

/**
 * Blog reads against the Vendure BlogPlugin (shop API: `blogs`, `blog`, `searchBlogs`, `blogFaq`).
 *
 * Every helper takes the active locale and passes it as `languageCode` so the backend resolves
 * the matching BlogTranslation. Cache tags follow the storefront vocabulary
 * (see src/app/api/revalidate/route.ts): `blog` for every list, `blog-<slug>` for one post.
 */

export const BLOG_CACHE_TAG = 'blog';
export const blogPostCacheTag = (slug: string) => `blog-${slug}`;

/** Upper bound accepted by the Vendure list resolvers. */
export const MAX_BLOG_TAKE = 100;

/**
 * `translations { languageCode slug }` is part of the card because hrefs must be built from
 * the base (German) slug: the backend resolves `blog(slug)` against the base entity's slug,
 * not the translated one (see src/lib/blog/slug.ts).
 */
export const BlogCardFragment = graphql(`
    fragment BlogCard on Blog @_unmask {
        id
        title
        slug
        translations {
            languageCode
            slug
        }
        excerpt
        publishedAt
        updatedAt
        author
        readingTime
        featured
        metaTags
        featuredImage {
            id
            name
            preview
            source
            width
            height
            mimeType
        }
        featuredImageAlt
        featuredImageTitle
    }
`);

export const GetBlogsQuery = graphql(`
    query GetBlogs($options: BlogListOptions) {
        blogs(options: $options) {
            totalItems
            items {
                ...BlogCard
            }
        }
    }
`, [BlogCardFragment]);

export const GetBlogSlugsQuery = graphql(`
    query GetBlogSlugs($options: BlogListOptions) {
        blogs(options: $options) {
            totalItems
            items {
                slug
                translations {
                    languageCode
                    slug
                }
                updatedAt
                publishedAt
            }
        }
    }
`);

export const GetBlogBySlugQuery = graphql(`
    query GetBlogBySlug($slug: String!) {
        blog(slug: $slug) {
            ...BlogCard
            createdAt
            contentHtml
            content
            metaTitle
            metaDescription
            canonicalUrl
            robotsMeta
            structuredData
            ogImage {
                id
                name
                preview
                source
                width
                height
                mimeType
            }
            inlineAssets {
                id
                altText
                titleText
                caption
                sourceAttribution
                sortOrder
                asset {
                    id
                    name
                    preview
                    source
                    width
                    height
                    mimeType
                }
            }
        }
    }
`, [BlogCardFragment]);

export const GetBlogFaqQuery = graphql(`
    query GetBlogFaq($slug: String!) {
        blogFaq(slug: $slug) {
            title
            intro
            schemaEnabled
            canonicalOwnerKey
            items {
                question
                answerHtml
                sortOrder
            }
        }
    }
`);

/** Ported from the old BlogSearch document; the /search integration itself is a later phase. */
export const SearchBlogsQuery = graphql(`
    query SearchBlogs($term: String!, $options: BlogListOptions) {
        searchBlogs(term: $term, options: $options) {
            totalItems
            items {
                ...BlogCard
            }
        }
    }
`, [BlogCardFragment]);

export type BlogCard = ResultOf<typeof BlogCardFragment>;
export type BlogDetail = NonNullable<ResultOf<typeof GetBlogBySlugQuery>['blog']>;
export type BlogInlineAsset = BlogDetail['inlineAssets'][number];
export type BlogFaqSection = NonNullable<ResultOf<typeof GetBlogFaqQuery>['blogFaq']>;
export type BlogFaqItem = BlogFaqSection['items'][number];

export interface BlogListResult {
    totalItems: number;
    items: BlogCard[];
}

interface BlogPageOptions {
    take: number;
    skip?: number;
}

function clampTake(take: number): number {
    return Math.max(1, Math.min(MAX_BLOG_TAKE, Math.floor(take)));
}

/**
 * One page of published posts, newest first. `take` is clamped to the backend maximum (100).
 */
export const getBlogs = cache(async (locale: string, {take, skip = 0}: BlogPageOptions): Promise<BlogListResult> => {
    const result = await query(
        GetBlogsQuery,
        {
            options: {
                take: clampTake(take),
                skip: Math.max(0, Math.floor(skip)),
                sort: {publishedAt: 'DESC'},
            },
        },
        {languageCode: locale, tags: [BLOG_CACHE_TAG]},
    );
    return result.data.blogs;
});

/** A single post by slug in the request language, or null when the slug is unknown. */
export const getBlogBySlug = cache(async (locale: string, slug: string): Promise<BlogDetail | null> => {
    const result = await query(GetBlogBySlugQuery, {slug}, {languageCode: locale, tags: [BLOG_CACHE_TAG, blogPostCacheTag(slug)]});
    return result.data.blog ?? null;
});

/** Published FAQ section attached to a post; null when the post has none. */
export const getBlogFaq = cache(async (locale: string, slug: string): Promise<BlogFaqSection | null> => {
    const result = await query(GetBlogFaqQuery, {slug}, {languageCode: locale, tags: [BLOG_CACHE_TAG, blogPostCacheTag(slug)]});
    return result.data.blogFaq ?? null;
});

export interface BlogSlugEntry {
    /** Base (German) slug, the only one the backend resolves; see src/lib/blog/slug.ts. */
    slug: string;
    lastModified: string | null;
}

/**
 * Base slugs of up to `limit` posts for the sitemap, newest first. Pages through the backend
 * in chunks of 100 because the list resolver caps `take`.
 */
export async function getBlogSlugs(limit = 1000): Promise<BlogSlugEntry[]> {
    const entries: BlogSlugEntry[] = [];
    let skip = 0;

    while (entries.length < limit) {
        const take = Math.min(MAX_BLOG_TAKE, limit - entries.length);
        const result = await query(
            GetBlogSlugsQuery,
            {options: {take, skip, sort: {publishedAt: 'DESC'}}},
            {tags: [BLOG_CACHE_TAG]},
        );
        const items = result.data.blogs.items;
        entries.push(...items.map((item) => ({
            slug: blogBaseSlug(item),
            lastModified: item.updatedAt || item.publishedAt || null,
        })));
        skip += items.length;
        if (items.length < take || skip >= result.data.blogs.totalItems) {
            break;
        }
    }

    return entries.slice(0, limit);
}
