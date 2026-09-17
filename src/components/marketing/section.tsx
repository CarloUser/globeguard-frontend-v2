import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface MarketingSectionProps {
    title?: ReactNode;
    subtitle?: ReactNode;
    /** `alt` = white band on the slate page background; `dark` = navy band for emphasis. */
    tone?: 'default' | 'alt' | 'dark';
    /** Rendered as the section heading level (H2 by default). */
    headingLevel?: 'h2' | 'h3';
    id?: string;
    className?: string;
    children: ReactNode;
}

const toneClasses: Record<NonNullable<MarketingSectionProps['tone']>, string> = {
    default: '',
    alt: 'border-y border-slate-200 bg-white',
    dark: 'bg-slate-950 text-white',
};

/** Consistent vertical rhythm, container width and heading style for marketing sections. */
export function MarketingSection({
    title,
    subtitle,
    tone = 'default',
    headingLevel: Heading = 'h2',
    id,
    className,
    children,
}: MarketingSectionProps) {
    const isDark = tone === 'dark';
    return (
        <section id={id} className={cn('py-12 md:py-16', toneClasses[tone], className)}>
            <div className="container mx-auto max-w-6xl px-4 lg:px-8">
                {(title || subtitle) && (
                    <div className="mb-8 max-w-3xl">
                        {title && (
                            <Heading className={cn('text-2xl font-bold md:text-3xl', isDark ? 'text-white' : 'text-foreground')}>
                                {title}
                            </Heading>
                        )}
                        {subtitle && (
                            <p className={cn('mt-3 text-base leading-7', isDark ? 'text-slate-300' : 'text-slate-600')}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}
