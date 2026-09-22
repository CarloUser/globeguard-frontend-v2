import {describe, expect, it, vi} from 'vitest';

// structured-data.ts reads the site origin from '@/lib/metadata', which pulls in next-intl's
// navigation (and therefore next/navigation) — not resolvable in a plain node test run.
vi.mock('@/lib/metadata', () => ({
    SITE_NAME: 'GlobeGuard',
    SITE_URL: 'https://globeguard.ch',
    buildCanonicalUrl: (path: string) => `https://globeguard.ch${path.startsWith('/') ? path : `/${path}`}`,
}));

import {buildBlogExcerpt, decorateBlogContentHtml, normalizeBlogTags, stripHtml} from '../content';
import {formatBlogDate, toIsoDate} from '../date';
import {MAX_BLOG_PAGE, blogListHref, parseBlogPage} from '../paging';
import {buildBlogSidebarData, findAdjacentPosts} from '../sidebar';
import {blogBaseSlug, blogPostHref} from '../slug';
import {buildBlogPostingJsonLd, parseBackendStructuredData, toAbsoluteUrl} from '../structured-data';
import type {BlogCard, BlogInlineAsset} from '@/lib/vendure/blog';

const asset = (overrides: Partial<BlogInlineAsset> = {}): BlogInlineAsset => ({
    id: '1',
    altText: 'OBD-Stecker im GlobeGuard PRO – LKW/BUS/TRAILER Set',
    titleText: 'GlobeGuard PRO',
    caption: null,
    sourceAttribution: null,
    sortOrder: 0,
    asset: {
        id: 'a1',
        name: 'obd.jpg',
        preview: 'http://localhost:3000/assets/preview/obd.jpg',
        source: 'http://localhost:3000/assets/source/obd.jpg',
        width: 1200,
        height: 800,
        mimeType: 'image/jpeg',
    },
    ...overrides,
});

const card = (slug: string, overrides: Partial<BlogCard> = {}): BlogCard => ({
    id: slug,
    title: slug,
    slug,
    translations: [{languageCode: 'de', slug}],
    excerpt: null,
    publishedAt: '2026-09-17T10:00:00.000Z',
    updatedAt: '2026-09-17T10:00:00.000Z',
    author: null,
    readingTime: 4,
    featured: false,
    metaTags: ['OBD', 'SGW'],
    featuredImage: null,
    featuredImageAlt: null,
    featuredImageTitle: null,
    ...overrides,
});

describe('decorateBlogContentHtml', () => {
    it('adds lazy loading, alt/title and dimensions from a matching inline asset', () => {
        const html = '<p>Text</p><img class="x" alt="old" src="http://localhost:3000/assets/source/obd.jpg" width="10">';
        const out = decorateBlogContentHtml(html, [asset()]);
        expect(out).toContain('loading="lazy"');
        expect(out).toContain('decoding="async"');
        expect(out).toContain('alt="OBD-Stecker im GlobeGuard PRO – LKW/BUS/TRAILER Set"');
        expect(out).toContain('title="GlobeGuard PRO"');
        expect(out).toContain('width="1200"');
        expect(out).toContain('height="800"');
        expect(out).not.toContain('alt="old"');
        expect(out).not.toContain('width="10"');
        expect(out).toContain('class="x"');
    });

    it('keeps an existing alt and adds an empty one otherwise when no asset matches', () => {
        expect(decorateBlogContentHtml('<img src="/x.jpg" alt="Kabel">', [])).toContain('alt="Kabel"');
        expect(decorateBlogContentHtml('<img src="/y.jpg">', [])).toContain('alt=""');
    });

    it('escapes quotes and angle brackets in curated alt text', () => {
        const out = decorateBlogContentHtml('<img src="/assets/source/obd.jpg">', [asset({altText: 'a "b" <c>'})]);
        expect(out).toContain('alt="a &quot;b&quot; &lt;c&gt;"');
    });

    it('returns an empty string for empty input', () => {
        expect(decorateBlogContentHtml('', [])).toBe('');
    });
});

describe('text helpers', () => {
    it('strips HTML and decodes common entities', () => {
        expect(stripHtml('<p>Ferndiagnose &amp; <b>SGW</b>&nbsp;Freischaltung</p>')).toBe('Ferndiagnose & SGW Freischaltung');
    });

    it('falls back to the title when the excerpt is empty', () => {
        expect(buildBlogExcerpt({excerpt: ' <p></p> ', title: ' Titel '})).toBe('Titel');
    });

    it('normalises tags (trim, dedupe, drop empties)', () => {
        expect(normalizeBlogTags([' OBD ', 'OBD', '', null as unknown as string, 'SGW'])).toEqual(['OBD', 'SGW']);
        expect(normalizeBlogTags(null)).toEqual([]);
    });
});

describe('dates', () => {
    it('formats de as Swiss numeric date and en with the Swiss mapping', () => {
        expect(formatBlogDate('2026-09-17T10:00:00.000Z', 'de')).toBe('17.09.2026');
        expect(formatBlogDate('2026-09-17 10:00:00', 'en')).toMatch(/2026/);
        expect(formatBlogDate('not a date', 'de')).toBe('not a date');
    });

    it('returns ISO strings only for parsable values', () => {
        expect(toIsoDate('2026-09-17T10:00:00.000Z')).toBe('2026-09-17T10:00:00.000Z');
        expect(toIsoDate('nope')).toBeUndefined();
        expect(toIsoDate(null)).toBeUndefined();
    });
});

describe('sidebar', () => {
    const posts = [card('a', {readingTime: 3}), card('b', {readingTime: 3, metaTags: ['OBD']}), card('c', {readingTime: 7, metaTags: null})];

    it('builds latest posts, read-time buckets and tags by frequency', () => {
        const data = buildBlogSidebarData(posts);
        expect(data.latestPosts.map((p) => p.slug)).toEqual(['a', 'b', 'c']);
        expect(data.readTimeBuckets).toEqual([
            {minutes: 3, count: 2},
            {minutes: 7, count: 1},
        ]);
        expect(data.tags).toEqual(['OBD', 'SGW']);
    });

    it('finds newer/older neighbours from a newest-first list', () => {
        expect(findAdjacentPosts(posts, 'b')).toEqual({newer: posts[0], older: posts[2]});
        expect(findAdjacentPosts(posts, 'a').newer).toBeNull();
        expect(findAdjacentPosts(posts, 'c').older).toBeNull();
        expect(findAdjacentPosts(posts, 'zzz')).toEqual({newer: null, older: null});
    });
});

describe('slugs', () => {
    it('uses the German translation slug for hrefs, whatever language the card was fetched in', () => {
        const post = card('sgw-unlock', {translations: [{languageCode: 'de', slug: 'sgw-freischaltung'}, {languageCode: 'en', slug: 'sgw-unlock'}]});
        expect(blogBaseSlug(post)).toBe('sgw-freischaltung');
        expect(blogPostHref(post)).toBe('/blog/sgw-freischaltung');
    });

    it('falls back to the fetched slug when there is no German translation', () => {
        expect(blogBaseSlug(card('only-en', {translations: []}))).toBe('only-en');
        expect(blogBaseSlug(card('x', {translations: [{languageCode: 'en', slug: 'y'}]}))).toBe('x');
    });
});

describe('paging', () => {
    it('parses positive integers and clamps to the int32-safe maximum', () => {
        expect(parseBlogPage(undefined)).toBe(1);
        expect(parseBlogPage('3')).toBe(3);
        expect(parseBlogPage(['7', '9'])).toBe(7);
        expect(parseBlogPage('2.9')).toBe(2);
        expect(parseBlogPage(String(MAX_BLOG_PAGE))).toBe(MAX_BLOG_PAGE);
        expect(parseBlogPage(String(MAX_BLOG_PAGE + 1))).toBe(MAX_BLOG_PAGE);
        expect((MAX_BLOG_PAGE - 1) * 10).toBeLessThanOrEqual(2147483647);
    });

    it('falls back to page 1 for zero, negatives, non-numbers and non-safe integers', () => {
        expect(parseBlogPage('0')).toBe(1);
        expect(parseBlogPage('-4')).toBe(1);
        expect(parseBlogPage('abc')).toBe(1);
        expect(parseBlogPage('')).toBe(1);
        expect(parseBlogPage('Infinity')).toBe(1);
        expect(parseBlogPage('99999999999999999999')).toBe(1);
    });

    it('builds the list href without a query for page 1', () => {
        expect(blogListHref(1)).toBe('/blog');
        expect(blogListHref(2)).toBe('/blog?page=2');
    });
});

describe('structured data', () => {
    it('resolves relative image paths against the site origin', () => {
        expect(toAbsoluteUrl('/globeguard-logo-transparent.png')).toBe('https://globeguard.ch/globeguard-logo-transparent.png');
        expect(toAbsoluteUrl('http://localhost:3000/assets/x.jpg')).toBe('http://localhost:3000/assets/x.jpg');
        expect(toAbsoluteUrl(null)).toBeUndefined();
    });

    it('builds a BlogPosting with a Person author when the post names one', () => {
        const post = {
            ...card('sgw-freischaltung', {author: 'GlobeGuard Team', readingTime: 5}),
            createdAt: '2026-09-01T00:00:00.000Z',
            content: '',
            contentHtml: '<p>x</p>',
            metaTitle: null,
            metaDescription: null,
            canonicalUrl: null,
            robotsMeta: null,
            structuredData: null,
            ogImage: null,
            inlineAssets: [],
        };
        const ld = buildBlogPostingJsonLd({post, url: 'https://globeguard.ch/blog/sgw-freischaltung', description: 'd', image: null, inLanguage: 'de-CH'});
        expect(ld['@type']).toBe('BlogPosting');
        expect(ld.author).toEqual({'@type': 'Person', name: 'GlobeGuard Team'});
        expect(ld.keywords).toBe('OBD, SGW');
        expect(ld.timeRequired).toBe('PT5M');
        expect(ld.image).toBeUndefined();
        expect(ld.inLanguage).toBe('de-CH');
    });

    it('accepts an object or an array of objects and ignores garbage', () => {
        expect(parseBackendStructuredData('{"@type":"Thing"}')).toEqual([{'@type': 'Thing'}]);
        expect(parseBackendStructuredData('[{"@type":"A"},1,"x",null]')).toEqual([{'@type': 'A'}]);
        expect(parseBackendStructuredData('{not json')).toEqual([]);
        expect(parseBackendStructuredData(null)).toEqual([]);
    });
});
