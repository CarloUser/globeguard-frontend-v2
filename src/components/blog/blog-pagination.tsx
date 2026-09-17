import {ChevronLeft, ChevronRight} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

interface BlogPaginationProps {
    currentPage: number;
    totalPages: number;
}

/** Canonical list URL: page 1 is the bare /blog, later pages carry ?page=N. */
export function blogPageHref(page: number): string {
    return page <= 1 ? '/blog' : `/blog?page=${page}`;
}

function pageNumbers(currentPage: number, totalPages: number): Array<number | 'gap'> {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            pages.push(i);
        }
    }

    const result: Array<number | 'gap'> = [];
    let previous = 0;
    for (const page of pages) {
        if (previous && page - previous > 1) {
            result.push('gap');
        }
        result.push(page);
        previous = page;
    }
    return result;
}

const BUTTON_CLASSES = 'inline-flex size-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors';
const LINK_CLASSES = 'border-slate-300 bg-white text-foreground hover:border-primary hover:text-primary';
const DISABLED_CLASSES = 'cursor-not-allowed border-slate-200 bg-white text-slate-300';

/**
 * Server-rendered pagination for the blog list (plain links, no client state; the URL is the state).
 */
export function BlogPagination({currentPage, totalPages}: BlogPaginationProps) {
    const t = useTranslations('Blog');
    if (totalPages <= 1) {
        return null;
    }

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return (
        <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center justify-center gap-2">
            {hasPrevious ? (
                <Link href={blogPageHref(currentPage - 1)} rel="prev" aria-label={t('previousPage')} className={cn(BUTTON_CLASSES, LINK_CLASSES)}>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                </Link>
            ) : (
                <span aria-disabled="true" className={cn(BUTTON_CLASSES, DISABLED_CLASSES)}>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                </span>
            )}

            {pageNumbers(currentPage, totalPages).map((page, index) =>
                page === 'gap' ? (
                    <span key={`gap-${index}`} className="px-1 text-slate-400">
                        &hellip;
                    </span>
                ) : page === currentPage ? (
                    <span
                        key={page}
                        aria-current="page"
                        className={cn(BUTTON_CLASSES, 'border-primary bg-primary text-primary-foreground')}
                    >
                        {page}
                    </span>
                ) : (
                    <Link key={page} href={blogPageHref(page)} aria-label={t('goToPage', {page})} className={cn(BUTTON_CLASSES, LINK_CLASSES)}>
                        {page}
                    </Link>
                ),
            )}

            {hasNext ? (
                <Link href={blogPageHref(currentPage + 1)} rel="next" aria-label={t('nextPage')} className={cn(BUTTON_CLASSES, LINK_CLASSES)}>
                    <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
            ) : (
                <span aria-disabled="true" className={cn(BUTTON_CLASSES, DISABLED_CLASSES)}>
                    <ChevronRight className="size-4" aria-hidden="true" />
                </span>
            )}
        </nav>
    );
}
