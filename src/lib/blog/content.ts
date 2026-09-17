import type {BlogInlineAsset} from '@/lib/vendure/blog';

/**
 * Ported from the old storefront (services/blog/content.ts).
 *
 * Post bodies arrive as editor HTML. Every `<img>` is rewritten so that it lazy-loads, decodes
 * asynchronously and, when the image matches one of the post's inline assets, carries the
 * curated alt/title text and the intrinsic width/height (prevents layout shift).
 */

function escapeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function normalizeUrlForCompare(value?: string | null): string {
    if (!value) {
        return '';
    }

    return value
        .trim()
        .replace(/^https?:\/\/[^/]+/i, '')
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '');
}

function removeManagedAttributes(rawAttributes: string): string {
    return rawAttributes
        .replace(/\s+(alt|title|loading|decoding|width|height|fetchpriority)=(".*?"|'.*?'|[^\s>]+)/gi, '')
        .trim();
}

/** Value of one attribute in a raw attribute string (quoted or bare), decoded so it can be re-escaped. */
function readAttribute(rawAttributes: string, name: string): string {
    const match = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(rawAttributes);
    const value = match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
    return value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function findInlineAsset(src: string, inlineAssets: readonly BlogInlineAsset[]): BlogInlineAsset | undefined {
    const normalizedSrc = normalizeUrlForCompare(src);
    if (normalizedSrc === '') {
        return undefined;
    }

    return inlineAssets.find((item) => {
        const assetSource = normalizeUrlForCompare(item.asset?.source);
        const assetPreview = normalizeUrlForCompare(item.asset?.preview);
        return normalizedSrc === assetSource || normalizedSrc === assetPreview;
    });
}

export function decorateBlogContentHtml(contentHtml: string, inlineAssets: readonly BlogInlineAsset[]): string {
    if (!contentHtml) {
        return '';
    }

    return contentHtml.replace(/<img\b([^>]*?)src=(['"])([^'"]+)\2([^>]*)>/gi, (_match, beforeSrc, quote, src, afterSrc) => {
        const matchedAsset = findInlineAsset(src, inlineAssets);
        const existingAttributes = `${beforeSrc || ''} ${afterSrc || ''}`;
        const cleanedAttributes = removeManagedAttributes(existingAttributes);
        const attributes = [
            cleanedAttributes,
            `src=${quote}${src}${quote}`,
            `loading=${quote}lazy${quote}`,
            `decoding=${quote}async${quote}`,
        ];

        if (matchedAsset?.altText) {
            attributes.push(`alt=${quote}${escapeHtmlAttribute(matchedAsset.altText)}${quote}`);
        } else {
            // No curated alt text: keep whatever the editor wrote, else an explicit empty alt.
            attributes.push(`alt=${quote}${escapeHtmlAttribute(readAttribute(existingAttributes, 'alt'))}${quote}`);
        }

        if (matchedAsset?.titleText) {
            attributes.push(`title=${quote}${escapeHtmlAttribute(matchedAsset.titleText)}${quote}`);
        }

        if (matchedAsset?.asset?.width) {
            attributes.push(`width=${quote}${String(matchedAsset.asset.width)}${quote}`);
        }

        if (matchedAsset?.asset?.height) {
            attributes.push(`height=${quote}${String(matchedAsset.asset.height)}${quote}`);
        }

        return `<img ${attributes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()} />`;
    });
}

/** Collapse HTML to plain text (excerpts, meta descriptions, alt fallbacks). */
export function stripHtml(value?: string | null): string {
    return (value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/** Excerpt for cards and meta descriptions: the stored excerpt, else the title. */
export function buildBlogExcerpt(post: {excerpt?: string | null; title: string}): string {
    return stripHtml(post.excerpt) || post.title.trim();
}

/** Sorted, de-duplicated tag list; the backend may hand back an empty array or null. */
export function normalizeBlogTags(metaTags?: readonly string[] | null): string[] {
    const seen = new Set<string>();
    for (const raw of metaTags || []) {
        const tag = (raw || '').trim();
        if (tag) {
            seen.add(tag);
        }
    }
    return Array.from(seen);
}
