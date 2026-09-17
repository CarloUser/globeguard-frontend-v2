import type {ReactNode} from 'react';
import {Check} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {PriceFrom} from '@/components/marketing/price-from';
import {cn} from '@/lib/utils';

export interface TierTeaserCardProps {
    /** e.g. "GlobeGuard BASIC" */
    name: ReactNode;
    /** Audience badge text ("Für Privatanwender" / "Für Werkstätten & Betriebe"). */
    badge?: ReactNode;
    audience?: 'b2c' | 'b2b';
    text: ReactNode;
    /** Optional check list; each entry may contain inline links. */
    checks?: ReactNode[];
    guidance?: ReactNode;
    /** Minimum NET price in Rappen; `null` hides the amount and shows the fallback label. */
    priceFrom?: number | null;
    cta: {href: string; label: ReactNode};
    className?: string;
}

/**
 * Tier card used by the device finder and the products hub. Layout only; all copy and
 * prices come from the caller (translations + catalogue).
 */
export function TierTeaserCard({
    name,
    badge,
    audience = 'b2c',
    text,
    checks,
    guidance,
    priceFrom,
    cta,
    className,
}: TierTeaserCardProps) {
    const isB2b = audience === 'b2b';

    return (
        <article
            className={cn(
                'flex h-full flex-col rounded-md border bg-white p-6',
                isB2b ? 'border-slate-900 shadow-sm' : 'border-slate-200',
                className,
            )}
        >
            {badge && (
                <span
                    className={cn(
                        'text-mono-label mb-3 inline-flex w-fit rounded-sm px-2 py-1',
                        isB2b ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600',
                    )}
                >
                    {badge}
                </span>
            )}
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>

            {checks && checks.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                    {checks.map((item, index) => (
                        <li key={index} className="flex gap-2">
                            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}

            {guidance && <p className="mt-4 text-sm italic leading-6 text-slate-500">{guidance}</p>}

            <div className="mt-auto pt-6">
                {priceFrom !== undefined && <PriceFrom value={priceFrom} className="mb-4" />}
                <Link href={cta.href} className={isB2b ? 'btn-secondary w-full' : 'btn-primary w-full'}>
                    {cta.label}
                </Link>
            </div>
        </article>
    );
}
