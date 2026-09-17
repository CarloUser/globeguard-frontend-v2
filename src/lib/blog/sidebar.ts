import type {BlogCard} from '@/lib/vendure/blog';
import {normalizeBlogTags} from './content';

/**
 * Ported from the old storefront (services/blog/sidebar.ts).
 *
 * The sidebar widgets are derived from one "source" list (the newest 100 posts) so that the
 * list page and the post page share a single extra round-trip.
 */

export interface ReadTimeBucket {
    minutes: number;
    count: number;
}

export interface BlogSidebarData {
    latestPosts: BlogCard[];
    readTimeBuckets: ReadTimeBucket[];
    tags: string[];
}

export const SIDEBAR_LATEST_POSTS = 4;
export const SIDEBAR_MAX_TAGS = 18;

export function buildBlogSidebarData(posts: readonly BlogCard[]): BlogSidebarData {
    const latestPosts = posts.slice(0, SIDEBAR_LATEST_POSTS);
    const timeCountMap = new Map<number, number>();
    const tagCountMap = new Map<string, number>();

    for (const post of posts) {
        const readingTime = post.readingTime ? Math.max(1, Math.round(post.readingTime)) : null;
        if (readingTime) {
            timeCountMap.set(readingTime, (timeCountMap.get(readingTime) || 0) + 1);
        }

        for (const tag of normalizeBlogTags(post.metaTags)) {
            tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
        }
    }

    const readTimeBuckets = Array.from(timeCountMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([minutes, count]) => ({minutes, count}));

    const tags = Array.from(tagCountMap.entries())
        .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], 'de-CH'))
        .slice(0, SIDEBAR_MAX_TAGS)
        .map(([tag]) => tag);

    return {latestPosts, readTimeBuckets, tags};
}

export interface AdjacentPosts {
    /** Newer post (published after the current one). */
    newer: BlogCard | null;
    /** Older post (published before the current one). */
    older: BlogCard | null;
}

/**
 * Previous/next neighbours from a newest-first list. Returns nulls when the current post is
 * not part of the source window (e.g. older than the newest 100 posts).
 */
export function findAdjacentPosts(posts: readonly BlogCard[], currentSlug: string): AdjacentPosts {
    const index = posts.findIndex((post) => post.slug === currentSlug);
    if (index === -1) {
        return {newer: null, older: null};
    }

    return {
        newer: index > 0 ? posts[index - 1] : null,
        older: index < posts.length - 1 ? posts[index + 1] : null,
    };
}
