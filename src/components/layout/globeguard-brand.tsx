import Image from 'next/image';
import {cn} from '@/lib/utils';

/**
 * Light-only brand mark (single logo asset, no dark-mode swap).
 */
export function GlobeguardBrand({
    compact = false,
    className,
    priority = false,
}: {
    compact?: boolean;
    className?: string;
    priority?: boolean;
}) {
    const logoClassName = compact ? 'w-[132px]' : 'w-[120px] sm:w-[168px]';

    return (
        <span className={cn('inline-flex items-center leading-none', className)}>
            <Image
                src="/globeguard-logo-transparent.png"
                alt="GlobeGuard"
                width={2048}
                height={512}
                className={cn('h-auto object-contain', logoClassName)}
                sizes={compact ? '132px' : '(min-width: 640px) 168px, 120px'}
                priority={priority}
            />
        </span>
    );
}
