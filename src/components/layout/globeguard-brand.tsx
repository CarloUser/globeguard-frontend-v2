import Image from 'next/image';
import {cn} from '@/lib/utils';

export function GlobeguardBrand({
    compact = false,
    className,
    priority = false,
}: {
    compact?: boolean;
    className?: string;
    priority?: boolean;
}) {
    const logoClassName = compact ? 'w-[132px]' : 'w-[168px]';

    return (
        <span className={cn('inline-flex items-center leading-none', className)} aria-label="GlobeGuard Diagnostics">
            <Image
                src="/globeguard-logo-transparent.png"
                alt="GlobeGuard Diagnostics"
                width={2048}
                height={512}
                className={cn('h-auto object-contain dark:hidden', logoClassName)}
                sizes={compact ? '132px' : '168px'}
                priority={priority}
            />
            <Image
                src="/globeguard-logo-transparent-dark.png"
                alt="GlobeGuard Diagnostics"
                width={2048}
                height={512}
                className={cn('hidden h-auto object-contain dark:block', logoClassName)}
                sizes={compact ? '132px' : '168px'}
                priority={priority}
            />
        </span>
    );
}
