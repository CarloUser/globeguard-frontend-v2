import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {Badge} from '@/components/ui/badge';
import {formatBlogDate, toIsoDate} from '@/lib/blog/date';
import {blogPostHref} from '@/lib/blog/slug';
import type {BlogSidebarData} from '@/lib/blog/sidebar';

interface BlogSidebarProps extends BlogSidebarData {
    /** Short blurb shown in the "about" widget; defaults to the blog description. */
    aboutText?: string | null;
}

function SidebarWidget({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

/**
 * Sidebar widgets ported from the old storefront: about, latest posts, reading time, tags.
 * Search and newsletter widgets are intentionally dropped (no search integration, no provider).
 */
export function BlogSidebar({aboutText, latestPosts, readTimeBuckets, tags}: BlogSidebarProps) {
    const t = useTranslations('Blog');
    const locale = useLocale();

    return (
        <aside className="space-y-4">
            <SidebarWidget title={t('aboutTitle')}>
                <p className="text-sm leading-6 text-slate-600">{aboutText?.trim() || t('description')}</p>
            </SidebarWidget>

            {latestPosts.length > 0 && (
                <SidebarWidget title={t('latestPosts')}>
                    <ul className="space-y-3">
                        {latestPosts.map((post) => {
                            const isoDate = toIsoDate(post.publishedAt);
                            return (
                                <li key={post.id}>
                                    <Link href={blogPostHref(post)} className="text-sm font-semibold leading-snug text-foreground hover:text-primary">
                                        {post.title}
                                    </Link>
                                    {isoDate && (
                                        <time dateTime={isoDate} className="mt-0.5 block text-xs text-slate-500">
                                            {formatBlogDate(post.publishedAt, locale)}
                                        </time>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </SidebarWidget>
            )}

            {readTimeBuckets.length > 0 && (
                <SidebarWidget title={t('readTime')}>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                        {readTimeBuckets.map((bucket) => (
                            <li key={bucket.minutes} className="flex items-center justify-between">
                                <span>{t('minRead', {minutes: bucket.minutes})}</span>
                                <span className="text-xs text-slate-500">{bucket.count}</span>
                            </li>
                        ))}
                    </ul>
                </SidebarWidget>
            )}

            {tags.length > 0 && (
                <SidebarWidget title={t('tags')}>
                    <ul className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <li key={tag}>
                                <Badge variant="outline">{tag}</Badge>
                            </li>
                        ))}
                    </ul>
                </SidebarWidget>
            )}
        </aside>
    );
}
