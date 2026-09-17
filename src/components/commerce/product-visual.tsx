import Image from 'next/image';
import {Cable, Headphones, Laptop, Package, ShieldCheck, Wrench} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {cn} from '@/lib/utils';

export type ProductVisualKind = 'device' | 'adapter' | 'software' | 'sgw' | 'remote' | 'accessory';

export function getProductVisualKind(name: string): ProductVisualKind {
    const value = name.toLowerCase();

    if (/(remote|fern|online|support|diagnostic service)/.test(value)) return 'remote';
    if (/(sgw|security gateway|gateway|stellantis|mercedes|vag|license|lizenz|freischaltung)/.test(value)) return 'sgw';
    if (/(software|update|extension|erweiterung|subscription|abo|diagcenter)/.test(value)) return 'software';
    if (/(adapter|cable|kabel|stecker|bypass|truma|sprinter|iveco|ktm|obd)/.test(value)) return 'adapter';
    if (/(basic|pro|elite|diagnose|diagnostic|scanner|reader|set)/.test(value)) return 'device';

    return 'accessory';
}

export function getProductVisualLabel(kind: ProductVisualKind) {
    return {
        device: 'Interface',
        adapter: 'Cable',
        software: 'Software',
        sgw: 'SGW',
        remote: 'Remote',
        accessory: 'Accessory',
    }[kind];
}

const iconByKind: Record<ProductVisualKind, LucideIcon> = {
    device: Wrench,
    adapter: Cable,
    software: Laptop,
    sgw: ShieldCheck,
    remote: Headphones,
    accessory: Package,
};

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

const placeholderByKind: Record<ProductVisualKind, string> = {
    device: '/placeholders/basic-kit.svg',
    adapter: '/placeholders/adapter-cables.svg',
    software: '/placeholders/software-updates.svg',
    sgw: '/placeholders/sgw-license.svg',
    remote: '/placeholders/remote-support.svg',
    accessory: '/placeholders/basic-kit.svg',
};

export function getProductPlaceholderSource(name: string): string {
    const value = name.toLowerCase();

    if (/(adapter|cable|kabel|stecker|truma|sprinter|iveco|ktm|obd)/.test(value)) {
        return '/placeholders/adapter-cables.svg';
    }

    if (/(sgw|security gateway|gateway|stellantis|mercedes|vag|license|lizenz|freischaltung)/.test(value)) {
        return '/placeholders/sgw-license.svg';
    }

    if (/(software|update|extension|erweiterung|subscription|abo|diagcenter)/.test(value)) {
        return '/placeholders/software-updates.svg';
    }

    if (/(remote|fern|online|support|diagnostic service)/.test(value)) {
        return '/placeholders/remote-support.svg';
    }

    if (/(pro|elite|workshop)/.test(value)) {
        return '/placeholders/pro-workshop.svg';
    }

    if (/(basic|camper|car)/.test(value)) {
        return '/placeholders/basic-kit.svg';
    }

    return placeholderByKind[getProductVisualKind(name)];
}

export function ProductVisual({name, asset, size = 'card', className, priority}: ProductVisualProps) {
    const kind = getProductVisualKind(name);
    const source = asset?.source || asset?.preview || getProductPlaceholderSource(name);
    const Icon = iconByKind[kind];

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
            className={cn(
                'flex items-center justify-center border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
                className,
            )}
            aria-label={getProductVisualLabel(kind)}
        >
            <div className="flex flex-col items-center gap-2">
                <Icon className={size === 'detail' ? 'size-14' : 'size-8'} strokeWidth={1.75} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {getProductVisualLabel(kind)}
                </span>
            </div>
        </div>
    );
}