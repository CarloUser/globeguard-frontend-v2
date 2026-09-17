import {CalendarDays, Clock, User} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {formatBlogDate, toIsoDate} from '@/lib/blog/date';
import {cn} from '@/lib/utils';

interface PostMetaProps {
    author?: string | null;
    publishedAt?: string | null;
    readingTime?: number | null;
    className?: string;
}

/**
 * Author / publish date / reading time line shared by the post card and the post header.
 * Renders nothing when none of the three values is present.
 */
export function PostMeta({author, publishedAt, readingTime, className}: PostMetaProps) {
    const t = useTranslations('Blog');
    const locale = useLocale();
    const authorName = author?.trim();
    const isoDate = toIsoDate(publishedAt);
    const minutes = readingTime ? Math.max(1, Math.round(readingTime)) : null;

    if (!authorName && !isoDate && !minutes) {
        return null;
    }

    return (
        <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500', className)}>
            {authorName && (
                <li className="inline-flex items-center gap-1.5">
                    <User className="size-4 shrink-0" aria-hidden="true" />
                    <span>{t('byAuthor', {author: authorName})}</span>
                </li>
            )}
            {isoDate && (
                <li className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                    <time dateTime={isoDate}>{formatBlogDate(publishedAt, locale)}</time>
                </li>
            )}
            {minutes && (
                <li className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 shrink-0" aria-hidden="true" />
                    <span>{t('minRead', {minutes})}</span>
                </li>
            )}
        </ul>
    );
}
