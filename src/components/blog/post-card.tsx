import Image from 'next/image';
import {ArrowRight} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {buildBlogExcerpt, stripHtml} from '@/lib/blog/content';
import type {BlogCard} from '@/lib/vendure/blog';
import {PostMeta} from './post-meta';

interface PostCardProps {
    post: BlogCard;
    /** Only the first card above the fold should be eager. */
    priority?: boolean;
}

/**
 * List entry on /blog: featured image (when present), title, meta line, excerpt, read-more link.
 */
export function PostCard({post, priority = false}: PostCardProps) {
    const t = useTranslations('Blog');
    const href = `/blog/${post.slug}`;
    const image = post.featuredImage?.preview || post.featuredImage?.source || null;
    const imageAlt = stripHtml(post.featuredImageAlt) || post.title;
    const imageTitle = stripHtml(post.featuredImageTitle) || undefined;

    return (
        <article className="overflow-hidden rounded-md border border-slate-200 bg-white transition-colors hover:border-primary">
            <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                {image && (
                    <Link href={href} className="relative block aspect-video bg-slate-100 md:aspect-auto md:min-h-56" tabIndex={-1} aria-hidden="true">
                        <Image
                            src={image}
                            alt={imageAlt}
                            title={imageTitle}
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            className="object-cover"
                            priority={priority}
                        />
                    </Link>
                )}
                <div className="flex flex-col gap-3 p-5">
                    <h2 className="text-xl font-bold leading-snug text-foreground">
                        <Link href={href} className="hover:text-primary">
                            {post.title}
                        </Link>
                    </h2>
                    <PostMeta author={post.author} publishedAt={post.publishedAt} readingTime={post.readingTime} />
                    <p className="text-sm leading-6 text-slate-600">{buildBlogExcerpt(post)}</p>
                    <Link href={href} className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary hover:underline">
                        {t('readMore')}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
