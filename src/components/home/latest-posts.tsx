import Image from 'next/image';
import {ArrowRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {PostMeta} from '@/components/blog/post-meta';
import {MarketingSection} from '@/components/marketing/section';
import {Link} from '@/i18n/navigation';
import {buildBlogExcerpt, stripHtml} from '@/lib/blog/content';
import {getBlogs, type BlogCard} from '@/lib/vendure/blog';

interface LatestPostsProps {
    locale: string;
}

const LATEST_POSTS_TAKE = 3;

/** Newest posts; a backend outage must not break the home page, so failures degrade to "no posts". */
async function loadLatestPosts(locale: string): Promise<BlogCard[]> {
    try {
        const result = await getBlogs(locale, {take: LATEST_POSTS_TAKE});
        return result.items;
    } catch (error) {
        console.error('[home] Failed to load latest blog posts', error);
        return [];
    }
}

/** "Aktuelle Neuigkeiten": the three newest blog posts as compact cards; hidden when there are none. */
export async function LatestPosts({locale}: LatestPostsProps) {
    const [t, tBlog, posts] = await Promise.all([
        getTranslations({locale, namespace: 'HomePage.news'}),
        getTranslations({locale, namespace: 'Blog'}),
        loadLatestPosts(locale),
    ]);

    if (posts.length === 0) {
        return null;
    }

    return (
        <MarketingSection title={t('title')}>
            <div className="grid gap-4 md:grid-cols-3">
                {posts.map((post) => {
                    const href = `/blog/${post.slug}`;
                    const image = post.featuredImage?.preview || post.featuredImage?.source || null;
                    const imageAlt = stripHtml(post.featuredImageAlt) || post.title;

                    return (
                        <article
                            key={post.id}
                            className="flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition-colors hover:border-primary"
                        >
                            {image && (
                                <Link href={href} className="relative block aspect-video bg-slate-100" tabIndex={-1} aria-hidden="true">
                                    <Image src={image} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                                </Link>
                            )}
                            <div className="flex flex-1 flex-col gap-3 p-5">
                                <h3 className="text-lg font-bold leading-snug text-foreground">
                                    <Link href={href} className="hover:text-primary">
                                        {post.title}
                                    </Link>
                                </h3>
                                <PostMeta publishedAt={post.publishedAt} readingTime={post.readingTime} />
                                <p className="line-clamp-3 text-sm leading-6 text-slate-600">{buildBlogExcerpt(post)}</p>
                                <Link
                                    href={href}
                                    className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary hover:underline"
                                >
                                    {tBlog('readMore')}
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>
            <div className="mt-6">
                <Link href="/blog" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                    {t('viewAll')}
                    <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                </Link>
            </div>
        </MarketingSection>
    );
}
