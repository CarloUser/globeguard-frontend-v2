import {cn} from '@/lib/utils';

interface BlogContentProps {
    /** Already decorated HTML (see decorateBlogContentHtml). */
    html: string;
    className?: string;
}

/**
 * Prose container for editor HTML. There is no typography plugin in this project, so the
 * element styles are expressed as Tailwind child-selector utilities on the wrapper.
 */
const PROSE_CLASSES = [
    'text-base leading-7 text-slate-700',
    '[&_p]:my-4',
    '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground',
    '[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-foreground',
    '[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground',
    '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80',
    '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1',
    '[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600',
    '[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md',
    '[&_figure]:my-6 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-slate-500',
    '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-slate-100',
    '[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_pre_code]:bg-transparent [&_pre_code]:p-0',
    '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2',
    '[&_hr]:my-8 [&_hr]:border-slate-200',
    '[&_strong]:font-semibold [&_strong]:text-foreground',
    '[&_iframe]:my-6 [&_iframe]:max-w-full',
    '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
].join(' ');

export function BlogContent({html, className}: BlogContentProps) {
    return <div className={cn('blog-content', PROSE_CLASSES, className)} dangerouslySetInnerHTML={{__html: html}} />;
}
