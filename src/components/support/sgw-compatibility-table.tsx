import {useTranslations} from 'next-intl';
import {sgwBrandGroups, vehicleGroupKey} from '@/components/brands/brand-groups';
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';

type SgwTranslator = ReturnType<typeof useTranslations<'SupportHub.sgw'>>;

function formatYears(t: SgwTranslator, fromYear: number, toYear: number | null | undefined): string {
    return toYear ? t('yearRange', {from: fromYear, to: toYear}) : t('yearFrom', {year: fromYear});
}

function licenseGroupLabel(t: SgwTranslator, licenseGroup: string): string {
    switch (licenseGroup) {
        case 'stellantis':
        case 'mercedes':
        case 'vag':
            return t(`licenseGroups.${licenseGroup}`);
        default:
            return t('licenseFallback');
    }
}

/**
 * SGW compatibility overview: every brand group of brand-compatibility.json that has an
 * `sgw` entry, with the bypass-cable model years and the licence group + model years.
 * Same data source as the picker and the product-page SGW upsell.
 */
export function SgwCompatibilityTable() {
    const t = useTranslations('SupportHub.sgw');
    const groups = sgwBrandGroups();

    return (
        <div className="rounded-md border border-slate-200 bg-white">
            <Table className="min-w-[640px]">
                <TableCaption className="sr-only">{t('tableCaption')}</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('thBrandGroup')}</TableHead>
                        <TableHead>{t('thVehicleClass')}</TableHead>
                        <TableHead>{t('thBypass')}</TableHead>
                        <TableHead>{t('thLicense')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map((group) => {
                        const groupKey = vehicleGroupKey(group.vehicleGroup);
                        const bypass = group.sgw?.bypass;
                        const license = group.sgw?.license;
                        return (
                            <TableRow key={group.id}>
                                <TableCell className="font-semibold text-foreground">{group.displayName}</TableCell>
                                <TableCell>{groupKey ? t(`vehicleGroups.${groupKey}`) : group.vehicleGroup}</TableCell>
                                <TableCell>
                                    {bypass ? `${t('modelYears')} ${formatYears(t, bypass.fromYear, bypass.toYear)}` : t('notRequired')}
                                </TableCell>
                                <TableCell>
                                    {license
                                        ? `${licenseGroupLabel(t, license.licenseGroup)} (${t('modelYears')} ${formatYears(t, license.fromYear, license.toYear)})`
                                        : t('notRequired')}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
