import type {Metadata} from 'next';
import {cache} from 'react';
import {Newspaper} from 'lucide-react';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {BlogPagination} from '@/components/blog/blog-pagination';
import {BlogSidebar} from '@/components/blog/blog-sidebar';
import {JsonLdScript} from '@/components/seo/json-ld';
import {PostCard} from '@/components/blog/post-card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from '@/components/ui/empty';
import {Link, getPathname} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {BLOG_ITEMS_PER_PAGE, blogListHref, parseBlogPage} from '@/lib/blog/paging';
import {buildBlogListingJsonLd, buildBreadcrumbJsonLd} from '@/lib/blog/structured-data';
import {buildBlogSidebarData} from '@/lib/blog/sidebar';
import {SITE_URL, buildAlternates, buildCanonicalUrl} from '@/lib/metadata';
import {getBlogs} from '@/lib/vendure/blog';

const SIDEBAR_SOURCE_TAKE = 100;

type SearchParams = Record<string, string | string[] | undefined>;

interface BlogListPageProps {
    searchParams: Promise<SearchParams>;
}

/**
 * Page + sidebar source for one listing page. Wrapped in React `cache()` with primitive
 * arguments so `generateMetadata` and the page body share a single pair of shop-API calls
 * (`getBlogs` itself is cached, but only by object identity of its options argument).
 */
const loadBlogListing = cache(async (locale: string, page: number) => {
    const [pageResult, sidebarSource] = await Promise.all([
        getBlogs(locale, {take: BLOG_ITEMS_PER_PAGE, skip: (page - 1) * BLOG_ITEMS_PER_PAGE}),
        getBlogs(locale, {take: SIDEBAR_SOURCE_TAKE}),
    ]);
    const totalPages = Math.max(1, Math.ceil(pageResult.totalItems / BLOG_ITEMS_PER_PAGE));
    return {pageResult, sidebarSource, totalPages};
});

export async function generateMetadata({searchParams}: BlogListPageProps): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Blog'});
    const page = parseBlogPage((await searchParams).page);
    const {totalPages} = await loadBlogListing(locale, page);

    // The page body answers with notFound(); no canonical/hreflang for a URL that 404s.
    if (page > totalPages) {
        return {
            title: t('notFound'),
            robots: {index: false, follow: false},
        };
    }

    const alternates = buildAlternates(locale, blogListHref(page));
    const title = page > 1 ? `${t('metaTitle')} – ${t('pageTitleSuffix', {page})}` : t('metaTitle');

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title,
        description: t('description'),
        alternates,
        openGraph: {
            title,
            description: t('description'),
            type: 'website',
            locale: toOgLocale(locale),
            url: alternates.canonical,
        },
    };
}

export default async function BlogListPage({searchParams}: BlogListPageProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Blog'});
    const currentPage = parseBlogPage((await searchParams).page);
    const {pageResult, sidebarSource, totalPages} = await loadBlogListing(locale, currentPage);

    if (currentPage > totalPages) {
        notFound();
    }

    const posts = pageResult.items;
    const sidebarData = buildBlogSidebarData(sidebarSource.items);
    const listUrl = buildCanonicalUrl(getPathname({locale, href: blogListHref(currentPage)}));
    const homeUrl = buildCanonicalUrl(getPathname({locale, href: '/'}));

    const jsonLd = [
        buildBreadcrumbJsonLd([
            {name: t('home'), url: homeUrl},
            {name: t('title'), url: listUrl},
        ]),
        buildBlogListingJsonLd({
            title: t('metaTitle'),
            description: t('description'),
            url: listUrl,
            posts,
            postUrl: (href) => buildCanonicalUrl(getPathname({locale, href})),
        }),
    ];

    return (
        <main id="main-content" className="bg-slate-50 pt-32">
            <JsonLdScript data={jsonLd} />

            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-6xl px-4 py-10 lg:px-8">
                    <Breadcrumb className="mb-6">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t('description')}</p>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                        <div className="space-y-6">
                            {posts.length === 0 ? (
                                <Empty className="rounded-md border border-dashed border-slate-300 bg-white">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Newspaper />
                                        </EmptyMedia>
                                        <EmptyTitle>{t('empty')}</EmptyTitle>
                                        <EmptyDescription>{t('emptyHint')}</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {posts.map((post, index) => (
                                            <PostCard key={post.id} post={post} priority={currentPage === 1 && index === 0} />
                                        ))}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="space-y-2 pt-2">
                                            <BlogPagination currentPage={currentPage} totalPages={totalPages} />
                                            <p className="text-center text-xs text-slate-500">
                                                {t('pageOf', {page: currentPage, total: totalPages})}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <BlogSidebar {...sidebarData} />
                    </div>
                </div>
            </section>
        </main>
    );
}
