import type {ComponentProps, ReactNode} from 'react';
import {cn} from '@/lib/utils';

const proseClassName =
    'text-base leading-7 text-slate-600 ' +
    '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2:first-child]:mt-0 ' +
    '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground ' +
    '[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground ' +
    '[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 ' +
    '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:text-primary/80 ' +
    '[&_strong]:font-semibold [&_strong]:text-foreground [&_hr]:my-6 [&_hr]:border-slate-200 ' +
    '[&_blockquote]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 ' +
    '[&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm ' +
    '[&_th]:border-b [&_th]:border-slate-200 [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground ' +
    '[&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top ' +
    '[&>*:last-child]:mb-0';

type ProseProps = Omit<ComponentProps<'div'>, 'dangerouslySetInnerHTML' | 'children'> &
    (
        | {
              /** Sanitized HTML (e.g. FAQ answers, which the backend sanitizes on write). */
              html: string;
              children?: never;
          }
        | {html?: never; children: ReactNode}
    );

/**
 * Typographic container for long-form text (legal pages, FAQ answers, CMS HTML) built on the
 * design tokens. It is the only place where `dangerouslySetInnerHTML` is used for content;
 * pass `html` exclusively for markup that the backend has already sanitized.
 */
export function Prose({className, html, children, ...props}: ProseProps) {
    if (typeof html === 'string') {
        return <div className={cn(proseClassName, className)} dangerouslySetInnerHTML={{__html: html}} {...props} />;
    }
    return (
        <div className={cn(proseClassName, className)} {...props}>
            {children}
        </div>
    );
}
