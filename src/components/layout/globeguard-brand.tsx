import Image from 'next/image';
import {cn} from '@/lib/utils';

/**
 * Light-only brand mark (single logo asset, no dark-mode swap).
 *
 * globeguard-logo-navy.png is globeguard-logo-transparent.png (single colour #006888 on
 * transparency) recoloured to the brand navy #0E1E4B of the footer (`--secondary`), alpha kept.
 * The footer still turns it white with `brightness-0 invert`, and the structured data (LOGO_PATH)
 * points at the same file. The teal original stays in public/ as the source of the recolouring.
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
                src="/globeguard-logo-navy.png"
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
