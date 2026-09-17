import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {monogram, type BrandLogoEntry} from './brand-groups';

/**
 * One brand logo (nominative use: indicates device compatibility only) or, when
 * brand-logos.json has no file for the brand, a monogram badge with the same footprint.
 */
export function BrandLogo({entry}: {entry: BrandLogoEntry}) {
    const t = useTranslations('SupportedBrands');

    if (!entry.img) {
        return (
            <span
                title={entry.label}
                aria-label={entry.label}
                className="flex h-10 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-bold tracking-wide text-slate-600"
            >
                {monogram(entry.label)}
            </span>
        );
    }

    return (
        <span title={entry.label} className="relative block h-10 w-16">
            <Image
                src={entry.img}
                alt={t('logoAlt', {brand: entry.label})}
                fill
                sizes="64px"
                className="object-contain"
            />
        </span>
    );
}
