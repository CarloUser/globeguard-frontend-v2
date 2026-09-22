'use client';

import {useMemo, useState, type FormEvent} from 'react';
import {useTranslations} from 'next-intl';
import {Price} from '@/components/commerce/price';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {NativeSelect, NativeSelectOption} from '@/components/ui/native-select';
import {useRouter} from '@/i18n/navigation';
import {
    encodeExtraBrands,
    getBrandsForTier,
    getProAddOnModules,
    getSelectableYears,
    getSgwRequirements,
    getVehicleTypesForTier,
    localizedLabel,
    type IBrandGroup,
    type IExtraBrandSelection,
    type ISgwRequirement,
    type IVehicleTypeOption,
} from '@/lib/globeguard/picker';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {cn} from '@/lib/utils';

/**
 * Tier picker (BASIC / WoMo / PRO): vehicle type -> brand group -> model year.
 *
 * Ported from the previous storefront (src/components/globeguard/TierPicker.tsx):
 * - The vehicle-type step is hidden when the tier only has one type (WoMo).
 * - Changing the vehicle type resets brand, year and both PRO extra slots.
 * - The product is resolved through `brandGroupId` -> product; its NET price is shown.
 * - PRO adds two optional extra-brand slots (same vehicle type minus the main brand and
 *   the other slot, plus the Truma module) with an optional model year each.
 * - Submit navigates to /products/[slug]?year=YYYY[&extraBrands=...]; the configuration
 *   lives only in the URL, the product page reads it from there.
 */

type PickerTier = 'BASIC' | 'WOMO' | 'PRO';

export interface TierPickerProps {
    tier: PickerTier;
    /** Products of the tier (Product.customFields.tierKey), mapped with `toCatalogProducts`. */
    products: CatalogProduct[];
    locale: string;
    className?: string;
}

type ExtraBrandSlots = [IExtraBrandSelection, IExtraBrandSelection];

const EMPTY_SLOT: IExtraBrandSelection = {brandGroupId: '', year: null};

function emptySlots(): ExtraBrandSlots {
    return [{...EMPTY_SLOT}, {...EMPTY_SLOT}];
}

interface VehicleTypeChooserProps {
    options: IVehicleTypeOption[];
    value: IVehicleTypeOption | null;
    locale: string;
    label: string;
    onChange: (option: IVehicleTypeOption) => void;
}

function VehicleTypeChooser({options, value, locale, label, onChange}: VehicleTypeChooserProps) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
            {options.map((option) => {
                const active = value?.key === option.key;
                return (
                    <button
                        key={option.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option)}
                        className={cn(
                            'rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-slate-300 bg-white text-foreground hover:border-primary hover:text-primary',
                        )}
                    >
                        {localizedLabel(option, locale)}
                    </button>
                );
            })}
        </div>
    );
}

export function TierPicker({tier, products, locale, className}: TierPickerProps) {
    const t = useTranslations('Tiers.picker');
    const router = useRouter();
    const withExtraBrands = tier === 'PRO';

    const vehicleTypes = useMemo(() => getVehicleTypesForTier(tier), [tier]);
    const [vehicleType, setVehicleType] = useState<IVehicleTypeOption | null>(vehicleTypes[0] ?? null);
    const [brandId, setBrandId] = useState('');
    const [year, setYear] = useState('');
    const [extraBrands, setExtraBrands] = useState<ExtraBrandSlots>(emptySlots);

    const brands = useMemo(() => (vehicleType ? getBrandsForTier(tier, vehicleType) : []), [tier, vehicleType]);
    const brand = useMemo(() => brands.find((entry) => entry.id === brandId) ?? null, [brands, brandId]);
    const years = useMemo(() => getSelectableYears(tier, brand), [tier, brand]);
    // Truma & co: modules that occupy a PRO brand slot (no model year, needs an adapter cable).
    const addOnModules = useMemo(() => (withExtraBrands ? getProAddOnModules() : []), [withExtraBrands]);

    const productByBrandGroup = useMemo(() => {
        const map = new Map<string, CatalogProduct>();
        for (const product of products) {
            if (product.brandGroupId) {
                map.set(product.brandGroupId, product);
            }
        }
        return map;
    }, [products]);

    const selectedProduct = brand ? (productByBrandGroup.get(brand.id) ?? null) : null;
    const selectedPrice = selectedProduct?.variants[0]?.priceNet ?? null;
    const numericYear = Number(year) || 0;
    const sgwRequirements = brand && numericYear ? getSgwRequirements(brand, numericYear) : [];
    const canSubmit = Boolean(selectedProduct) && numericYear > 0;

    const formatRequirement = (requirement: ISgwRequirement): string => {
        if (requirement.type === 'bypass-cable') {
            return t('sgwCable', {cable: requirement.detail});
        }
        const key = `sgwLicense.${requirement.detail}`;
        return t.has(key) ? t(key) : t('sgwLicenseFallback', {detail: requirement.detail});
    };

    const onVehicleTypeChange = (next: IVehicleTypeOption) => {
        setVehicleType(next);
        setBrandId('');
        setYear('');
        setExtraBrands(emptySlots());
    };

    const onBrandChange = (nextBrandId: string) => {
        setBrandId(nextBrandId);
        // A slot holding the newly chosen main brand becomes invalid.
        setExtraBrands((previous) =>
            previous.map((slot) => (slot.brandGroupId === nextBrandId ? {...EMPTY_SLOT} : slot)) as ExtraBrandSlots,
        );
    };

    const updateExtraBrand = (slotIndex: 0 | 1, patch: Partial<IExtraBrandSelection>) => {
        setExtraBrands((previous) => {
            const next = [...previous] as ExtraBrandSlots;
            next[slotIndex] = {...next[slotIndex], ...patch};
            return next;
        });
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedProduct || !numericYear) {
            return;
        }

        const params = new URLSearchParams({year: String(numericYear)});
        const seen = new Set<string>();
        const extras = extraBrands.filter((entry) => {
            if (!entry.brandGroupId || entry.brandGroupId === brandId || seen.has(entry.brandGroupId)) {
                return false;
            }
            seen.add(entry.brandGroupId);
            return true;
        });
        const encodedExtras = encodeExtraBrands(extras);
        if (encodedExtras) {
            params.set('extraBrands', encodedExtras);
        }

        router.push(`/products/${selectedProduct.slug}?${params.toString()}`);
    };

    const renderExtraBrandSlot = (slotIndex: 0 | 1) => {
        const selection = extraBrands[slotIndex];
        const extraBrand: IBrandGroup | null =
            brands.find((entry) => entry.id === selection.brandGroupId) ??
            addOnModules.find((entry) => entry.id === selection.brandGroupId) ??
            null;
        const isModule = Boolean(extraBrand?.proAddOnSku);
        const extraYears = extraBrand && !isModule ? getSelectableYears(tier, extraBrand) : [];
        const extraSgw = extraBrand && !isModule && selection.year ? getSgwRequirements(extraBrand, selection.year) : [];
        // Each brand may only be picked once across the main brand + both slots.
        const takenByOtherSlot = (entryId: string) =>
            extraBrands.some((other, otherIndex) => otherIndex !== slotIndex && other.brandGroupId === entryId);
        const brandSelectId = `gg-extra-brand-${slotIndex}`;
        const yearSelectId = `gg-extra-year-${slotIndex}`;

        return (
            <div key={slotIndex} className="space-y-2">
                <Label htmlFor={brandSelectId}>{t('extraBrandLabel', {slot: slotIndex + 2})}</Label>
                <NativeSelect
                    id={brandSelectId}
                    className="w-full"
                    value={selection.brandGroupId}
                    onChange={(event) => updateExtraBrand(slotIndex, {brandGroupId: event.target.value, year: null})}
                >
                    <NativeSelectOption value="">{t('none')}</NativeSelectOption>
                    {brands
                        .filter((entry) => entry.id !== brandId && !takenByOtherSlot(entry.id))
                        .map((entry) => (
                            <NativeSelectOption key={entry.id} value={entry.id}>
                                {entry.displayName}
                            </NativeSelectOption>
                        ))}
                    {addOnModules
                        .filter((entry) => !takenByOtherSlot(entry.id))
                        .map((entry) => (
                            <NativeSelectOption key={entry.id} value={entry.id}>
                                {t('moduleOption', {name: entry.displayName})}
                            </NativeSelectOption>
                        ))}
                </NativeSelect>

                {extraBrand && isModule && (
                    <p className="text-xs leading-5 text-slate-600">{t('moduleHint', {name: extraBrand.displayName})}</p>
                )}

                {extraBrand && !isModule && (
                    <div className="space-y-2 pt-1">
                        <Label htmlFor={yearSelectId}>{t('extraYearLabel')}</Label>
                        <NativeSelect
                            id={yearSelectId}
                            className="w-full"
                            value={selection.year ?? ''}
                            onChange={(event) => updateExtraBrand(slotIndex, {year: Number(event.target.value) || null})}
                        >
                            <NativeSelectOption value="">{t('yearUnknown')}</NativeSelectOption>
                            {extraYears.map((entry) => (
                                <NativeSelectOption key={entry} value={entry}>
                                    {entry}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        {extraSgw.length > 0 && (
                            <p className="text-xs leading-5 text-amber-800">
                                {t('extraSgwHint', {name: extraBrand.displayName})}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // WoMo has a single base-vehicle class (PKW & Van) — hide the type step.
    const showVehicleTypeStep = vehicleTypes.length > 1;

    return (
        <form
            onSubmit={onSubmit}
            className={cn('rounded-md border border-slate-200 bg-white p-5 md:p-8', className)}
        >
            {showVehicleTypeStep && (
                <fieldset className="mb-6 border-0 p-0">
                    <legend className="mb-3 text-lg font-bold text-foreground">{t('stepVehicleType')}</legend>
                    <VehicleTypeChooser
                        options={vehicleTypes}
                        value={vehicleType}
                        locale={locale}
                        label={t('vehicleTypeGroup')}
                        onChange={onVehicleTypeChange}
                    />
                </fieldset>
            )}

            <fieldset className="border-0 p-0">
                <legend className="mb-3 text-lg font-bold text-foreground">
                    {showVehicleTypeStep ? t('stepBrandYearSecond') : t('stepBrandYearFirst')}
                </legend>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="gg-brand">{t('brandLabel')}</Label>
                        <NativeSelect
                            id="gg-brand"
                            className="w-full"
                            value={brandId}
                            onChange={(event) => onBrandChange(event.target.value)}
                        >
                            <NativeSelectOption value="">{t('pleaseSelect')}</NativeSelectOption>
                            {brands.map((entry) => (
                                <NativeSelectOption key={entry.id} value={entry.id}>
                                    {entry.displayName}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gg-year">{t('yearLabel')}</Label>
                        <NativeSelect
                            id="gg-year"
                            className="w-full"
                            value={year}
                            disabled={!brand}
                            onChange={(event) => setYear(event.target.value)}
                        >
                            <NativeSelectOption value="">{t('pleaseSelect')}</NativeSelectOption>
                            {years.map((entry) => (
                                <NativeSelectOption key={entry} value={entry}>
                                    {entry}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </div>
                </div>

                {withExtraBrands && brand && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {renderExtraBrandSlot(0)}
                        {renderExtraBrandSlot(1)}
                        <p className="text-xs leading-5 text-slate-600 md:col-span-2">{t('proSlotsHint')}</p>
                    </div>
                )}
            </fieldset>

            {sgwRequirements.length > 0 && (
                <Alert className="mt-6 border-amber-300 bg-amber-50 text-amber-900">
                    <AlertTitle>{t('sgwTitle')}</AlertTitle>
                    <AlertDescription className="text-amber-900">
                        {t('sgwRequired', {requirements: sgwRequirements.map(formatRequirement).join(' + ')})}
                    </AlertDescription>
                </Alert>
            )}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="min-h-6">
                    {selectedPrice !== null && (
                        <p className="text-sm text-slate-600">
                            <span>{tier === 'WOMO' ? t('priceLabelWomo') : t('priceLabel')}</span>{' '}
                            <Price value={selectedPrice} showVatNote className="text-xl font-bold text-foreground" />
                        </p>
                    )}
                    {brand && !selectedProduct && (
                        <p className="text-xs leading-5 text-slate-600">{t('productLoading')}</p>
                    )}
                </div>
                <Button type="submit" size="lg" disabled={!canSubmit} className="font-semibold md:min-w-48">
                    {t('toProduct')}
                </Button>
            </div>
        </form>
    );
}
