import {useTranslations} from 'next-intl';
import {Badge} from '@/components/ui/badge';
import {Link} from '@/i18n/navigation';
import {BASIC_FROM_YEAR, PRO_FROM_YEAR, type IBrandGroup} from '@/lib/globeguard/picker';
import {logoEntriesFor} from './brand-groups';
import {BrandLogo} from './brand-logo';

/**
 * Brand-group tile on /unterstuetzte-marken: logos of every brand in the group,
 * the group name and the tier / SGW badges derived from brand-compatibility.json.
 */
export function BrandGroupCard({group}: {group: IBrandGroup}) {
    const t = useTranslations('SupportedBrands');
    const entries = logoEntriesFor(group);
    const hasBasic = group.tiers.includes('BASIC');
    const hasPro = group.tiers.includes('PRO');
    const hasWomo = group.tiers.includes('WOMO');

    return (
        <div className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-4">
            <div className="flex min-h-10 flex-wrap items-center gap-2">
                {entries.map((entry) => (
                    <BrandLogo key={entry.label} entry={entry} />
                ))}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{group.displayName}</h3>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                {hasBasic && (
                    <Badge variant="secondary">{t('tierBasic', {year: group.basicFromYear ?? BASIC_FROM_YEAR})}</Badge>
                )}
                {hasPro && <Badge variant="secondary">{t('tierPro', {year: PRO_FROM_YEAR})}</Badge>}
                {hasWomo && <Badge variant="secondary">{t('tierWomo')}</Badge>}
                {group.sgw && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800" render={<Link href="/support/sgw" />}>
                        {t('sgw')}
                    </Badge>
                )}
            </div>
        </div>
    );
}
