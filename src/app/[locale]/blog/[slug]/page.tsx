import type {Metadata} from 'next';
import Image from 'next/image';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {BlogContent} from '@/components/blog/blog-content';
import {BlogFaq} from '@/components/blog/blog-faq';
import {BlogSidebar} from '@/components/blog/blog-sidebar';
import {JsonLdScript} from '@/components/seo/json-ld';
import {PostMeta} from '@/components/blog/post-meta';
import {Badge} from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {Link, getPathname} from '@/i18n/navigation';
import {toIntlLocale, toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {buildBlogExcerpt, decorateBlogContentHtml, normalizeBlogTags, stripHtml} from '@/lib/blog/content';
import {formatBlogDate, toIsoDate} from '@/lib/blog/date';
import {buildBlogSidebarData, findAdjacentPosts} from '@/lib/blog/sidebar';
import {blogPostHref} from '@/lib/blog/slug';
import {
    buildBlogPostingJsonLd,
    buildBreadcrumbJsonLd,
    buildFaqPageJsonLd,
    parseBackendStructuredData,
    toAbsoluteUrl,
    type JsonLd,
} from '@/lib/blog/structured-data';
import {SITE_URL, buildAlternates, buildCanonicalUrl, buildOgImages, truncateDescription} from '@/lib/metadata';
import {getBlogBySlug, getBlogFaq, getBlogs, type BlogCard} from '@/lib/vendure/blog';
import {blogFaqOwnerKey, shouldEmitFaqSchema} from '@/lib/vendure/faq';

const SIDEBAR_SOURCE_TAKE = 100;

interface BlogPostPageProps {
    params: Promise<{locale: string; slug: string}>;
}

/** Vendure assets accept resize parameters; the OG image is cropped to the 1.91:1 social format. */
function toSocialImage(imageUrl?: string | null): string | undefined {
    if (!imageUrl) {
        return undefined;
    }
    return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}w=1200&h=630&mode=crop`;
}

/** Map the backend's free-text robots directive ("noindex, follow") to Next metadata. */
function toRobots(robotsMeta?: string | null): Metadata['robots'] {
    const directives = (robotsMeta || '')
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
    if (directives.length === 0) {
        return undefined;
    }
    return {
        index: !directives.includes('noindex'),
        follow: !directives.includes('nofollow'),
    };
}

export async function generateMetadata({params}: BlogPostPageProps): Promise<Metadata> {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Blog'});
    const post = await getBlogBySlug(locale, slug);

    if (!post) {
        return {title: t('notFound')};
    }

    const title = post.metaTitle?.trim() || post.title;
    const description = truncateDescription(post.metaDescription || buildBlogExcerpt(post) || t('description'));
    // Hrefs/alternates always use the base slug (src/lib/blog/slug.ts), never the translated one.
    const alternates = buildAlternates(locale, blogPostHref(post));
    const canonical = toAbsoluteUrl(post.canonicalUrl) || alternates.canonical;
    const featuredImage = post.featuredImage?.source || post.featuredImage?.preview;
    const socialImage = toSocialImage(post.ogImage?.source || post.ogImage?.preview || featuredImage);
    const imageAlt = stripHtml(post.featuredImageAlt) || post.title;
    const tags = normalizeBlogTags(post.metaTags);

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title,
        description,
        keywords: tags.length > 0 ? tags : undefined,
        alternates: {...alternates, canonical},
        robots: toRobots(post.robotsMeta),
        openGraph: {
            title,
            description,
            type: 'article',
            locale: toOgLocale(locale),
            url: canonical,
            images: buildOgImages(socialImage, imageAlt),
            publishedTime: toIsoDate(post.publishedAt),
            modifiedTime: toIsoDate(post.updatedAt) ?? toIsoDate(post.publishedAt),
            authors: post.author ? [post.author] : undefined,
            tags: tags.length > 0 ? tags : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: socialImage ? [socialImage] : undefined,
        },
    };
}

function AdjacentPostLink({post, direction, label}: {post: BlogCard; direction: 'newer' | 'older'; label: string}) {
    const Icon = direction === 'newer' ? ArrowLeft : ArrowRight;
    return (
        <Link
            href={blogPostHref(post)}
            rel={direction === 'newer' ? 'prev' : 'next'}
            className={`group flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-primary ${direction === 'older' ? 'text-right md:items-end' : ''}`}
        >
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {direction === 'newer' && <Icon className="size-3.5" aria-hidden="true" />}
                {label}
                {direction === 'older' && <Icon className="size-3.5" aria-hidden="true" />}
            </span>
            <span className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">{post.title}</span>
        </Link>
    );
}

export default async function BlogPostPage({params}: BlogPostPageProps) {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Blog'});

    const [post, faq, sidebarSource] = await Promise.all([
        getBlogBySlug(locale, slug),
        getBlogFaq(locale, slug),
        getBlogs(locale, {take: SIDEBAR_SOURCE_TAKE}),
    ]);

    if (!post) {
        notFound();
    }

    const articleHtml = decorateBlogContentHtml(post.contentHtml || post.content || '', post.inlineAssets);
    const excerpt = buildBlogExcerpt(post);
    const description = post.metaDescription?.trim() || excerpt;
    const tags = normalizeBlogTags(post.metaTags);
    const featuredImage = post.featuredImage;
    const featuredImageUrl = featuredImage?.source || featuredImage?.preview || null;
    const featuredImageAlt = stripHtml(post.featuredImageAlt) || post.title;
    const featuredImageTitle = stripHtml(post.featuredImageTitle) || undefined;
    const updatedIso = toIsoDate(post.updatedAt);
    const showUpdated = Boolean(updatedIso && post.publishedAt && updatedIso.slice(0, 10) !== (toIsoDate(post.publishedAt) ?? '').slice(0, 10));

    const otherPosts = sidebarSource.items.filter((item) => item.id !== post.id);
    const sidebarData = buildBlogSidebarData(otherPosts);
    const {newer, older} = findAdjacentPosts(sidebarSource.items, post.slug);

    const faqItems = faq ? [...faq.items].sort((a, b) => a.sortOrder - b.sortOrder) : [];
    const hasFaq = faqItems.length > 0;

    const homeUrl = buildCanonicalUrl(getPathname({locale, href: '/'}));
    const blogUrl = buildCanonicalUrl(getPathname({locale, href: '/blog'}));
    const postUrl = toAbsoluteUrl(post.canonicalUrl) || buildCanonicalUrl(getPathname({locale, href: blogPostHref(post)}));

    const jsonLd: JsonLd[] = [
        buildBreadcrumbJsonLd([
            {name: t('home'), url: homeUrl},
            {name: t('title'), url: blogUrl},
            {name: post.title, url: postUrl},
        ]),
        buildBlogPostingJsonLd({
            post,
            url: postUrl,
            description,
            image: post.ogImage?.source || post.ogImage?.preview || featuredImageUrl,
            inLanguage: toIntlLocale(locale),
        }),
        // FAQPage schema only when this post is the section's canonical owner (`blog:<slug>`);
        // a section duplicated onto several pages must emit the schema once.
        ...(shouldEmitFaqSchema(faq, blogFaqOwnerKey(slug)) ? [buildFaqPageJsonLd(faqItems)] : []),
        ...parseBackendStructuredData(post.structuredData),
    ];

    return (
        <main className="bg-slate-50 pt-32">
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
                                <BreadcrumbLink render={<Link href="/blog" />}>{t('title')}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="line-clamp-1">{post.title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="max-w-4xl text-3xl font-bold leading-tight text-foreground md:text-4xl">{post.title}</h1>
                    <PostMeta className="mt-4" author={post.author} publishedAt={post.publishedAt} readingTime={post.readingTime} />
                    {showUpdated && (
                        <p className="mt-1 text-xs text-slate-500">
                            {t('updatedOn', {date: formatBlogDate(post.updatedAt, locale)})}
                        </p>
                    )}
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                        <article className="min-w-0">
                            {featuredImageUrl && (
                                <figure className="relative mb-8 aspect-video overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                                    <Image
                                        src={featuredImageUrl}
                                        alt={featuredImageAlt}
                                        title={featuredImageTitle}
                                        fill
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 800px"
                                        className="object-cover"
                                    />
                                </figure>
                            )}

                            <div className="rounded-md border border-slate-200 bg-white p-5 md:p-8">
                                <BlogContent html={articleHtml} />

                                {tags.length > 0 && (
                                    <ul className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-6" aria-label={t('tags')}>
                                        {tags.map((tag) => (
                                            <li key={tag}>
                                                <Badge variant="outline">{tag}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {hasFaq && faq && <BlogFaq section={{...faq, items: faqItems}} />}

                            {(newer || older) && (
                                <nav aria-label={t('title')} className="mt-8 grid gap-3 md:grid-cols-2">
                                    <div>{newer && <AdjacentPostLink post={newer} direction="newer" label={t('newerPost')} />}</div>
                                    <div>{older && <AdjacentPostLink post={older} direction="older" label={t('olderPost')} />}</div>
                                </nav>
                            )}

                            <div className="mt-8">
                                <Link href="/blog" className="btn-secondary">
                                    <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                                    {t('backToBlog')}
                                </Link>
                            </div>
                        </article>

                        <BlogSidebar {...sidebarData} aboutText={excerpt} />
                    </div>
                </div>
            </section>
        </main>
    );
}
