/**
 * Pagination helpers for /blog. Kept free of Next imports so the list page's metadata and
 * body can share them and they stay unit-testable.
 */

export const BLOG_ITEMS_PER_PAGE = 10;

/**
 * Largest page whose `skip` still fits the backend's 32-bit `Int` list offset
 * (`(MAX_BLOG_PAGE - 1) * BLOG_ITEMS_PER_PAGE < 2^31`). Larger values would make the
 * shop API reject the query instead of returning an empty page.
 */
export const MAX_BLOG_PAGE = Math.floor(2147483647 / BLOG_ITEMS_PER_PAGE);

/**
 * `?page=` from the search params: a positive safe integer clamped to `MAX_BLOG_PAGE`;
 * anything else (missing, non-numeric, zero, negative, non-safe) is page 1.
 */
export function parseBlogPage(raw: string | string[] | undefined): number {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const parsed = Number.parseInt(String(value ?? '1'), 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        return 1;
    }
    return Math.min(parsed, MAX_BLOG_PAGE);
}

/** `/blog` for page 1, `/blog?page=N` afterwards; used for canonical + hreflang. */
export function blogListHref(page: number): string {
    return page > 1 ? `/blog?page=${page}` : '/blog';
}
