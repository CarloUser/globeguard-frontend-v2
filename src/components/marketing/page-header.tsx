import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    /** Optional CTA row or badges rendered under the subtitle. */
    children?: ReactNode;
    className?: string;
}

/**
 * White page header band shared by the marketing pages (matches /support and /kontakt).
 * Renders the H1; pages must not add a second H1.
 */
export function PageHeader({title, subtitle, children, className}: PageHeaderProps) {
    return (
        <section className={cn('border-b border-slate-200 bg-white', className)}>
            <div className="container mx-auto max-w-6xl px-4 py-10 lg:px-8">
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
                {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{subtitle}</p>}
                {children}
            </div>
        </section>
    );
}
