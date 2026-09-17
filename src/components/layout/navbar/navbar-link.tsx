'use client';

import {useSelectedLayoutSegment} from 'next/navigation';
import {ComponentProps} from 'react';
import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

export function NavbarLink({href, className, ...rest}: ComponentProps<typeof Link>) {
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : '/';
    const isActive = pathname === href;

    return (
        <Link
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                'text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-accent',
                isActive && 'text-primary dark:text-accent',
                className
            )}
            href={href}
            {...rest}
        />
    );
}