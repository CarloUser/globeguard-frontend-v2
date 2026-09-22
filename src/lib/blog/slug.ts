import type {BlogCard} from '@/lib/vendure/blog';

/**
 * Language whose translation carries the "base" slug of a post: the backend resolves
 * `blog(slug)` (and `blogFaq(slug)`) against the base entity's slug, which is the German one.
 */
export const BLOG_BASE_LANGUAGE = 'de';

/**
 * Slug to use in every href, alternate and sitemap entry of a post, independent of the
 * language the post was fetched in. Falls back to the translated slug when the German
 * translation is missing.
 *
 * NOTE: until the backend resolves translated slugs (owner follow-up B), the de and en slugs
 * of a post must stay identical — an English-only slug would 404 because the route param is
 * always looked up against the base slug.
 */
export function blogBaseSlug(post: Pick<BlogCard, 'slug' | 'translations'>): string {
    return post.translations.find((translation) => translation.languageCode === BLOG_BASE_LANGUAGE)?.slug ?? post.slug;
}

/** Locale-agnostic href of a post (`/blog/<base slug>`), for next-intl `Link`/`getPathname`. */
export function blogPostHref(post: Pick<BlogCard, 'slug' | 'translations'>): string {
    return `/blog/${blogBaseSlug(post)}`;
}
