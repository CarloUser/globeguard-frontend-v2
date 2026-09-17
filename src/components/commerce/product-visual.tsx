import Image from 'next/image';
import {ImageOff} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';

interface ProductVisualProps {
    name: string;
    asset?: {
        preview?: string | null;
        source?: string | null;
    } | null;
    size?: 'card' | 'detail';
    className?: string;
    priority?: boolean;
}

/**
 * Renders the product's featured asset, or a neutral placeholder box when the
 * catalogue has no image. There is no name-based classification and no
 * illustrative device art; product imagery comes from Vendure assets only.
 */
export function ProductVisual({name, asset, size = 'card', className, priority}: ProductVisualProps) {
    const t = useTranslations('Product');
    const source = asset?.source || asset?.preview;

    if (source) {
        return (
            <div className={cn('relative overflow-hidden bg-slate-50', className)}>
                <Image
                    src={source}
                    alt={name}
                    fill
                    priority={priority}
                    className={cn('object-contain', size === 'detail' ? 'p-6' : 'p-2')}
                    sizes={size === 'detail' ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                />
            </div>
        );
    }

    return (
        <div
            className={cn('flex items-center justify-center border-slate-200 bg-slate-50 text-slate-400', className)}
            role="img"
            aria-label={`${name}: ${t('noImage')}`}
        >
            <div className="flex flex-col items-center gap-2">
                <ImageOff className={size === 'detail' ? 'size-14' : 'size-8'} strokeWidth={1.5} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{t('noImage')}</span>
            </div>
        </div>
    );
}
