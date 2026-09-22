'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useId, useMemo, useRef, useState, type ReactNode} from 'react';

import {Price} from '@/components/commerce/price';
import {useDisplayCurrency} from '@/components/providers/display-currency-provider';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Link} from '@/i18n/navigation';
import {formatMoney} from '@/lib/display-currency';
import {
    buildAddOnPlan,
    DEFAULT_SELECTIONS,
    findVariantByOptionCode,
    getExtensionBrandOptions,
    SGW_LICENSE_QUANTITY_MAX,
    SGW_LICENSE_QUANTITY_MIN,
    toggleEliteMixedBrand,
    type AddOnPlan,
    type ConfiguratorSelections,
    type ExtraBrandRow,
} from '@/lib/globeguard/add-on-plan';
import {
    ELITE_MIXED_MAX_BRANDS,
    ELITE_MIXED_MIN_BRANDS,
    getEliteMixedEligibleBrands,
    SGW_CABLE_SKUS,
    SGW_LICENSE_DURATIONS,
    SGW_LICENSE_SKUS,
    type DurationCode,
    type IExtraBrandSelection,
    type ISgwRequirement,
    type SgwCableCode,
    type SgwLicenseGroup,
} from '@/lib/globeguard/picker';
import type {CatalogProduct, CatalogVariant} from '@/lib/globeguard/types';
import {cn} from '@/lib/utils';

import {useAddOnLineLabel} from './add-on-label';
import {SgwRemoveConfirmDialog} from './sgw-remove-confirm-dialog';

export interface ProductConfiguratorProps {
    product: CatalogProduct;
    selectedVariant: CatalogVariant;
    /** `?year` from the picker URL (null when absent). */
    urlYear: number | null;
    /** Decoded `?extraBrands` (decodeExtraBrands) — pass a stable reference (server prop / memo). */
    extraBrands: IExtraBrandSelection[];
    /** Add-on products keyed by SKU (indexAddOnProductsBySku); a missing SKU silently omits its line. */
    addOnProducts: Record<string, CatalogProduct | undefined>;
    locale: string;
    /** Number of devices from the page's quantity input (default 1); add-on quantities scale with it. */
    deviceQuantity?: number;
    /** Fired whenever the plan changes (also once on mount) so the page can price and add to cart. */
    onChange: (plan: AddOnPlan, selections: ConfiguratorSelections, quantity: number) => void;
    className?: string;
}

const LICENSE_GROUPS = Object.keys(SGW_LICENSE_SKUS) as SgwLicenseGroup[];
const CABLE_CODES = Object.keys(SGW_CABLE_SKUS) as SgwCableCode[];
const KNOWN_LICENSE_GROUPS: readonly string[] = ['stellantis', 'mercedes', 'vag'];
const KNOWN_CABLE_CODES: readonly string[] = ['IVE', 'FCCA'];

const SGW_QUANTITY_OPTIONS = Array.from(
    {length: SGW_LICENSE_QUANTITY_MAX - SGW_LICENSE_QUANTITY_MIN + 1},
    (_, index) => SGW_LICENSE_QUANTITY_MIN + index,
);

/** Bordered option block; `tone` mirrors the previous storefront's neutral / blue notices. */
function OptionPanel({tone = 'neutral', className, children}: {tone?: 'neutral' | 'info'; className?: string; children: ReactNode}) {
    return (
        <div
            className={cn(
                'rounded-md border p-4 text-sm leading-6',
                tone === 'info' ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50',
                className,
            )}
        >
            {children}
        </div>
    );
}

function WarningText({children}: {children: ReactNode}) {
    return <p className="mt-2 text-sm font-semibold text-destructive">{children}</p>;
}

/**
 * Product-page configurator for GlobeGuard devices, PRO Erweiterungen and licences.
 * Holds the customer's selections (SGW tick / duration / quantity, extra-brand SGW ticks,
 * Truma cable, ELITE Mixed brands, ELITE SGW multi-select, extension brand) and derives the
 * add-on plan with the pure domain builder on every change. The page owns the selected
 * variant, the device quantity and the add-to-cart button; it receives the plan via onChange.
 *
 * Behaviour ported 1:1 from the previous storefront's ProductConfigurator.tsx.
 */
export function ProductConfigurator({
    product,
    selectedVariant,
    urlYear,
    extraBrands,
    addOnProducts,
    locale,
    deviceQuantity = 1,
    onChange,
    className,
}: ProductConfiguratorProps) {
    const t = useTranslations('Configurator');
    const addOnLabel = useAddOnLineLabel();
    const {displayCurrency} = useDisplayCurrency();
    const activeLocale = useLocale();
    const priceLocale = locale || activeLocale;
    const idPrefix = useId();

    const [selections, setSelections] = useState<ConfiguratorSelections>(DEFAULT_SELECTIONS);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const plan = useMemo(
        () => buildAddOnPlan({product, selectedVariant, urlYear, extraBrands, selections, addOnProducts, deviceQuantity}),
        [product, selectedVariant, urlYear, extraBrands, selections, addOnProducts, deviceQuantity],
    );

    // Publish to the page only when something actually changed (guards against parent re-render loops).
    const publishedRef = useRef('');
    useEffect(() => {
        const signature = JSON.stringify({plan, selections, deviceQuantity});
        if (signature === publishedRef.current) {
            return;
        }
        publishedRef.current = signature;
        onChange(plan, selections, deviceQuantity);
    }, [plan, selections, deviceQuantity, onChange]);

    const update = (
        patch: Partial<ConfiguratorSelections> | ((previous: ConfiguratorSelections) => Partial<ConfiguratorSelections>),
    ) => setSelections((previous) => ({...previous, ...(typeof patch === 'function' ? patch(previous) : patch)}));

    const extensionBrandOptions = useMemo(() => getExtensionBrandOptions(product), [product]);
    const mixedEligibleBrands = useMemo(
        () => (plan.flags.isEliteMixed ? getEliteMixedEligibleBrands() : []),
        [plan.flags.isEliteMixed],
    );

    const durationLabel = (code: DurationCode) => t(`durations.${code}`);
    const licenseGroupLabel = (group: string) => (
        KNOWN_LICENSE_GROUPS.includes(group) ? t(`licenseGroups.${group}`) : t('licenseGroups.other', {detail: group})
    );
    const cableName = (code: string) => (KNOWN_CABLE_CODES.includes(code) ? t(`cableNames.${code}`) : code);
    const requirementLabel = (requirement: ISgwRequirement) => (
        requirement.type === 'bypass-cable' ? t('addOn.sgwCable', {cable: requirement.detail}) : licenseGroupLabel(requirement.detail)
    );
    const requirementShortLabel = (requirement: ISgwRequirement) => (
        requirement.type === 'bypass-cable'
            ? t('extras.bypassShort', {detail: requirement.detail})
            : (KNOWN_LICENSE_GROUPS.includes(requirement.detail) ? t(`licenseGroups.${requirement.detail}`) : t('extras.licenseShort'))
    );
    const joinRequirements = (requirements: ISgwRequirement[], short = false) => requirements
        .map((requirement) => (short ? requirementShortLabel(requirement) : requirementLabel(requirement)))
        .join(t('sgw.requirementSeparator'));

    const sgwLink = (chunks: ReactNode) => (
        <Link href="/support/sgw" className="font-medium text-primary underline underline-offset-2">{chunks}</Link>
    );
    const servicesLink = (chunks: ReactNode) => (
        <Link href="/produkte/kategorie/services" className="font-medium text-primary underline underline-offset-2">{chunks}</Link>
    );

    if (!plan.flags.hasConfigurator) {
        return null;
    }

    const {flags} = plan;
    const fromYear = selectedVariant.compatibleFromYear ?? null;
    const toYear = selectedVariant.compatibleToYear ?? null;
    const rangeParams = {from: fromYear ?? 0, to: toYear ?? 'none'};

    // Main-brand SGW: licence requirement → duration variants carry the live NET price.
    const mainLicenseRequirement = plan.mainSgwRequirements.find((requirement) => requirement.type === 'license');
    const mainLicenseProduct = mainLicenseRequirement ? addOnProducts[SGW_LICENSE_SKUS[mainLicenseRequirement.detail]] : undefined;
    const durationItems = Object.fromEntries(
        SGW_LICENSE_DURATIONS.map((entry) => {
            const durationVariant = findVariantByOptionCode(mainLicenseProduct?.variants, entry.code);
            const label = durationVariant
                ? t('sgw.durationWithPrice', {label: durationLabel(entry.code), price: formatMoney(durationVariant.priceNet, displayCurrency, priceLocale)})
                : durationLabel(entry.code);
            return [entry.code, label];
        }),
    );
    const plainDurationItems = Object.fromEntries(SGW_LICENSE_DURATIONS.map((entry) => [entry.code, durationLabel(entry.code)]));
    const quantityItems = Object.fromEntries(SGW_QUANTITY_OPTIONS.map((count) => [String(count), t('sgw.pieces', {count})]));
    const extensionItems = Object.fromEntries(extensionBrandOptions.map((group) => [group.id, group.displayName]));

    const eliteMixedCount = selections.eliteMixedBrandIds.length;
    const eliteMixedFull = eliteMixedCount >= ELITE_MIXED_MAX_BRANDS;

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <SgwRemoveConfirmDialog
                open={confirmOpen}
                onKeep={() => {
                    update({sgwSelected: true});
                    setConfirmOpen(false);
                }}
                onRemove={() => {
                    update({sgwSelected: false});
                    setConfirmOpen(false);
                }}
            />

            {/* Standalone licence products: the duration is the variant ("Ausführung") selector. */}
            {flags.isStandaloneLicense && plan.selectedVariantDuration && (
                <p className="text-sm text-muted-foreground">{t('variant.stockUpHint', {duration: plan.selectedVariantDuration})}</p>
            )}

            {/* Standalone PRO Erweiterung: brand group (fixed for INEOS / Truma). */}
            {flags.isStandaloneExtension && (
                <OptionPanel tone="info">
                    <p className="font-semibold text-foreground">{t('extension.heading')}</p>
                    {flags.isIneosExtension || flags.isTrumaExtension ? (
                        <p className="mt-1.5 text-muted-foreground">
                            {flags.isTrumaExtension ? t('extension.trumaNote') : t('extension.ineosNote')}
                        </p>
                    ) : (
                        <div className="mt-2 max-w-sm">
                            <Label htmlFor={`${idPrefix}-ext-brand`} className="mb-1.5">{t('extension.label')}</Label>
                            <Select
                                items={extensionItems}
                                value={plan.extensionBrandGroupId}
                                onValueChange={(value) => update({extensionBrandGroupId: value ?? null})}
                            >
                                <SelectTrigger id={`${idPrefix}-ext-brand`} className="w-full bg-white" aria-invalid={plan.warnings.includes('extension-brand-missing') || undefined}>
                                    <SelectValue placeholder={t('extension.pleaseSelect')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {extensionBrandOptions.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>{group.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <p className="mt-2 text-muted-foreground">{t('extension.hint')}</p>
                    {plan.warnings.includes('extension-brand-missing') && <WarningText>{t('extension.missing')}</WarningText>}
                </OptionPanel>
            )}

            {/* Model-year compatibility of the selected variant vs the picker year. */}
            {urlYear && plan.yearFits !== null && (
                plan.yearFits ? (
                    <p className="text-sm font-semibold text-emerald-700">
                        {t('year.fits', {year: urlYear})}
                        {plan.brandGroup ? ` ${t('year.fitsBrand', {brand: plan.brandGroup.displayName})}` : ''}
                        {fromYear ? ` – ${t('year.range', rangeParams)}` : ''}
                    </p>
                ) : (
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                        <AlertTitle>{t('year.misfit', {year: urlYear})}</AlertTitle>
                        <AlertDescription>
                            {fromYear ? t('year.misfitRange', rangeParams) : ''} {t('year.misfitHint')}
                        </AlertDescription>
                    </Alert>
                )
            )}

            {/* Main-brand Security Gateway unlock (auto-ticked). */}
            {plan.mainSgwRequirements.length > 0 && plan.brandGroup && urlYear && (
                <OptionPanel>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id={`${idPrefix}-sgw`}
                            className="mt-1 bg-white"
                            checked={selections.sgwSelected}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    update({sgwSelected: true});
                                } else {
                                    setConfirmOpen(true);
                                }
                            }}
                        />
                        <Label htmlFor={`${idPrefix}-sgw`} className="block cursor-pointer text-sm leading-6 font-normal">
                            <span className="block font-semibold text-foreground">{t('sgw.heading')}</span>
                            <span className="block">
                                {t('sgw.requires', {
                                    brand: plan.brandGroup.displayName,
                                    year: urlYear,
                                    requirements: joinRequirements(plan.mainSgwRequirements),
                                })}
                            </span>
                        </Label>
                    </div>

                    {selections.sgwSelected && mainLicenseRequirement && (
                        <div className="mt-3 flex max-w-xs flex-col gap-3">
                            <div>
                                <Label htmlFor={`${idPrefix}-sgw-quantity`} className="mb-1.5">{t('sgw.quantityLabel')}</Label>
                                <Select
                                    items={quantityItems}
                                    value={String(selections.sgwQuantity)}
                                    onValueChange={(value) => update({sgwQuantity: Number(value) || SGW_LICENSE_QUANTITY_MIN})}
                                >
                                    <SelectTrigger id={`${idPrefix}-sgw-quantity`} className="w-full bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SGW_QUANTITY_OPTIONS.map((count) => (
                                            <SelectItem key={count} value={String(count)}>{t('sgw.pieces', {count})}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="mt-1.5 text-muted-foreground">{t('variant.stockUpHint', {duration: selections.sgwDuration})}</p>
                            </div>
                            <div>
                                <Label htmlFor={`${idPrefix}-sgw-duration`} className="mb-1.5">{t('sgw.durationLabel')}</Label>
                                <Select
                                    items={durationItems}
                                    value={selections.sgwDuration}
                                    onValueChange={(value) => update({sgwDuration: (value ?? 'day') as DurationCode})}
                                >
                                    <SelectTrigger id={`${idPrefix}-sgw-duration`} className="w-full bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SGW_LICENSE_DURATIONS.map((entry) => (
                                            <SelectItem key={entry.code} value={entry.code}>{durationItems[entry.code]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <p className="mt-3 text-muted-foreground">{t.rich('sgw.unsure', {sgw: sgwLink, services: servicesLink})}</p>
                    {plan.warnings.includes('sgw-unticked') && <WarningText>{t('sgw.warning')}</WarningText>}
                </OptionPanel>
            )}

            {/* PRO extra brands from ?extraBrands (Erweiterung + module cable + per-brand SGW). */}
            {plan.extraBrandRows.length > 0 && (
                <OptionPanel tone="info">
                    <p className="font-semibold text-foreground">{t('extras.heading')}</p>
                    <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
                        {plan.extraBrandRows.map((row: ExtraBrandRow) => (
                            <li key={row.brand.id}>
                                {row.isModule ? (
                                    <>
                                        {t('extras.moduleSlot', {name: row.brand.displayName})}
                                        {row.brand.requiresCableSku && (
                                            <div className="mt-1 flex items-start gap-2">
                                                <Checkbox
                                                    id={`${idPrefix}-module-cable-${row.brand.id}`}
                                                    className="mt-1 bg-white"
                                                    checked={selections.trumaCableSelected}
                                                    onCheckedChange={(checked) => update({trumaCableSelected: checked})}
                                                />
                                                <Label htmlFor={`${idPrefix}-module-cable-${row.brand.id}`} className="cursor-pointer text-sm leading-6 font-normal">
                                                    {t('extras.moduleCablePrompt', {name: row.brand.displayName})}
                                                </Label>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {row.brand.displayName}
                                        {' '}
                                        {row.selection.year ? t('extras.yearChosen', {year: row.selection.year}) : t('extras.yearOpen')}
                                        {row.requirements.length > 0 && (
                                            <div className="mt-1 flex items-start gap-2">
                                                <Checkbox
                                                    id={`${idPrefix}-extra-sgw-${row.brand.id}`}
                                                    className="mt-1 bg-white"
                                                    checked={row.sgwSelected}
                                                    onCheckedChange={(checked) => update((previous) => ({
                                                        extraSgwSelected: {...previous.extraSgwSelected, [row.brand.id]: checked},
                                                    }))}
                                                />
                                                <Label htmlFor={`${idPrefix}-extra-sgw-${row.brand.id}`} className="cursor-pointer text-sm leading-6 font-normal">
                                                    {t('extras.sgwPrompt', {requirements: joinRequirements(row.requirements, true)})}
                                                </Label>
                                            </div>
                                        )}
                                        {!row.selection.year && (
                                            <p className="mt-1 text-muted-foreground">{t.rich('extras.yearOpenHint', {sgw: sgwLink})}</p>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </OptionPanel>
            )}

            {/* Truma adapter cable set (WoMo device / standalone Truma extension), auto-ticked. */}
            {(flags.isWomo || flags.isTrumaExtension) && (
                <OptionPanel>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id={`${idPrefix}-truma`}
                            className="mt-1 bg-white"
                            checked={selections.trumaCableSelected}
                            onCheckedChange={(checked) => update({trumaCableSelected: checked})}
                        />
                        <Label htmlFor={`${idPrefix}-truma`} className="block cursor-pointer text-sm leading-6 font-normal">
                            <span className="block font-semibold text-foreground">{t('truma.heading')}</span>
                            <span className="block">{t('truma.text')}</span>
                        </Label>
                    </div>
                    {plan.warnings.includes('truma-cable-unticked') && <WarningText>{t('truma.warning')}</WarningText>}
                </OptionPanel>
            )}

            {/* ELITE Cars Mixed: 4–10 brand groups. */}
            {flags.isEliteMixed && (
                <OptionPanel tone="info">
                    <p className="font-semibold text-foreground">
                        {t('eliteMixed.heading', {count: eliteMixedCount, max: ELITE_MIXED_MAX_BRANDS, min: ELITE_MIXED_MIN_BRANDS})}
                    </p>
                    <p className="mt-1 mb-3 text-muted-foreground">{t('eliteMixed.hint')}</p>
                    <div
                        role="group"
                        aria-label={t('eliteMixed.gridLabel')}
                        className="grid max-h-64 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 overflow-y-auto rounded-md border border-sky-200 bg-white p-3"
                    >
                        {mixedEligibleBrands.map((brand) => {
                            const checked = selections.eliteMixedBrandIds.includes(brand.id);
                            const disabled = !checked && eliteMixedFull;
                            const checkboxId = `${idPrefix}-mixed-${brand.id}`;

                            return (
                                <div key={brand.id} className={cn('flex items-center gap-2', disabled && 'opacity-50')}>
                                    <Checkbox
                                        id={checkboxId}
                                        checked={checked}
                                        disabled={disabled}
                                        onCheckedChange={() => update((previous) => ({
                                            eliteMixedBrandIds: toggleEliteMixedBrand(previous.eliteMixedBrandIds, brand.id),
                                        }))}
                                    />
                                    <Label htmlFor={checkboxId} className={cn('text-sm font-normal', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
                                        {brand.displayName}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                    {plan.warnings.includes('elite-mixed-invalid') && (
                        <WarningText>{t('eliteMixed.invalid', {min: ELITE_MIXED_MIN_BRANDS})}</WarningText>
                    )}
                </OptionPanel>
            )}

            {/* ELITE (non-Mixed): free SGW multi-select, nothing preselected. */}
            {flags.isEliteDevice && (
                <OptionPanel>
                    <p className="font-semibold text-foreground">{t('eliteSgw.heading')}</p>
                    <p className="mt-1 mb-3 text-muted-foreground">{t('eliteSgw.hint')}</p>
                    <div className="flex flex-col gap-2">
                        {LICENSE_GROUPS.map((licenseGroup) => {
                            const license = selections.eliteSgw.licenses[licenseGroup];
                            const checkboxId = `${idPrefix}-elite-lic-${licenseGroup}`;

                            return (
                                <div key={licenseGroup} className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={checkboxId}
                                            className="bg-white"
                                            checked={Boolean(license?.selected)}
                                            onCheckedChange={(checked) => update({
                                                eliteSgw: {
                                                    ...selections.eliteSgw,
                                                    licenses: {
                                                        ...selections.eliteSgw.licenses,
                                                        [licenseGroup]: {selected: checked, duration: license?.duration ?? 'day'},
                                                    },
                                                },
                                            })}
                                        />
                                        <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                                            {licenseGroupLabel(licenseGroup)}
                                        </Label>
                                    </div>
                                    {license?.selected && (
                                        <Select
                                            items={plainDurationItems}
                                            value={license.duration}
                                            onValueChange={(value) => update({
                                                eliteSgw: {
                                                    ...selections.eliteSgw,
                                                    licenses: {
                                                        ...selections.eliteSgw.licenses,
                                                        [licenseGroup]: {selected: true, duration: (value ?? 'day') as DurationCode},
                                                    },
                                                },
                                            })}
                                        >
                                            <SelectTrigger size="sm" className="w-36 bg-white" aria-label={t('sgw.durationAria')}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SGW_LICENSE_DURATIONS.map((entry) => (
                                                    <SelectItem key={entry.code} value={entry.code}>{durationLabel(entry.code)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            );
                        })}
                        {CABLE_CODES.map((cable) => {
                            const checkboxId = `${idPrefix}-elite-cable-${cable}`;

                            return (
                                <div key={cable} className="flex items-center gap-2">
                                    <Checkbox
                                        id={checkboxId}
                                        className="bg-white"
                                        checked={Boolean(selections.eliteSgw.cables[cable])}
                                        onCheckedChange={(checked) => update({
                                            eliteSgw: {...selections.eliteSgw, cables: {...selections.eliteSgw.cables, [cable]: checked}},
                                        })}
                                    />
                                    <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                                        {t('eliteSgw.cable', {name: cableName(cable)})}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </OptionPanel>
            )}

            {/* What lands in the cart besides the device. */}
            {plan.lines.length > 0 && (
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{t('summary.heading')}</span>
                    {' '}
                    {plan.lines.map((line) => addOnLabel(line)).join(t('summary.listSeparator'))}
                    {' '}
                    {t('summary.together')}
                    {' '}
                    <Price value={plan.totalAddOnsNet} className="font-semibold text-foreground" />
                </p>
            )}

            {(plan.brandGroup || flags.isEliteDevice) && (
                <p className="text-sm">
                    <Link href="/produkte/kategorie/services" className="font-medium text-primary underline underline-offset-2">
                        {t('sgw.allServicesLink')}
                    </Link>
                </p>
            )}
        </div>
    );
}

export default ProductConfigurator;
