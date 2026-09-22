'use client';

import {Check, CheckCircle2, ShoppingCart, Truck} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {useCallback, useMemo, useState, useTransition} from 'react';
import {toast} from 'sonner';

import {addConfiguredItemsAction} from '@/app/[locale]/products/[slug]/actions';
import {Price, VatNote} from '@/components/commerce/price';
import {useDisplayCurrency} from '@/components/providers/display-currency-provider';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useRouter} from '@/i18n/navigation';
import {formatMoney} from '@/lib/display-currency';
import {
    BLOCKING_WARNINGS,
    buildAddOnPlan,
    buildCartLines,
    CONFIRM_WARNINGS,
    DEFAULT_SELECTIONS,
    isPlanBlocked,
    type AddOnPlan,
    type AddOnPlanWarning,
} from '@/lib/globeguard/add-on-plan';
import {ELITE_MIXED_MIN_BRANDS, type IExtraBrandSelection} from '@/lib/globeguard/picker';
import {HIGHLIGHT_BULLETS, type ProductHighlight} from '@/lib/globeguard/product-highlights';
import {buildPurchaseQuantityOptions, getPurchaseQuantityRules, sanitizePurchaseQuantity} from '@/lib/globeguard/purchase-quantities';
import type {CatalogProduct, CatalogVariant} from '@/lib/globeguard/types';

import {EliteNoSgwConfirmDialog} from './elite-no-sgw-confirm-dialog';
import {ProductConfigurator} from './product-configurator';
import {usePreservePickerParams} from './use-preserve-picker-params';

/** Option group of a multi-variant product (licences: the "Dauer" duration group). */
export interface VariantOptionGroup {
    code: string;
    name: string;
    options: Array<{code: string; name: string}>;
}

export interface ConfigurableProductPanelProps {
    product: CatalogProduct;
    /** Option groups derived from the variants; empty for single-variant products. */
    optionGroups: VariantOptionGroup[];
    /** Highlight bullets (server-computed, locale-aware); keys map to Configurator.highlights.*. */
    highlights: ProductHighlight[];
    urlYear: number | null;
    extraBrands: IExtraBrandSelection[];
    addOnProducts: Record<string, CatalogProduct | undefined>;
    locale: string;
}

const DEVICE_QUANTITY_OPTIONS = buildPurchaseQuantityOptions(getPurchaseQuantityRules(null), 20);
const DEVICE_QUANTITY_RULES = getPurchaseQuantityRules(null);

function initialOptionCodes(variant: CatalogVariant | undefined): Record<string, string> {
    const codes: Record<string, string> = {};
    variant?.options.forEach((option) => {
        codes[option.groupCode] = option.code;
    });
    return codes;
}

function findVariantByOptions(variants: CatalogVariant[], optionCodes: Record<string, string>): CatalogVariant | undefined {
    return variants.find((variant) => Object.entries(optionCodes).every(([groupCode, code]) => (
        variant.options.some((option) => option.groupCode === groupCode && option.code === code)
    )));
}

/**
 * Purchase panel for configurable products (BASIC / WoMo / PRO / ELITE devices, PRO
 * Erweiterungen, SGW / Ferndiagnose licences): title, variant radios where a product has
 * real options, the ProductConfigurator, the live "device + options" NET price, quantity,
 * add-to-cart (blocking + confirm rules from the domain), shipping note and highlights.
 */
export function ConfigurableProductPanel({
    product,
    optionGroups,
    highlights,
    urlYear,
    extraBrands,
    addOnProducts,
    locale,
}: ConfigurableProductPanelProps) {
    const t = useTranslations('Configurator');
    const tProduct = useTranslations('Product');
    const activeLocale = useLocale();
    const priceLocale = locale || activeLocale;
    const router = useRouter();
    const {displayCurrency} = useDisplayCurrency();
    const [isPending, startTransition] = useTransition();

    usePreservePickerParams(product.slug);

    const [optionCodes, setOptionCodes] = useState<Record<string, string>>(() => initialOptionCodes(product.variants[0]));
    const selectedVariant = useMemo(
        () => findVariantByOptions(product.variants, optionCodes) ?? product.variants[0],
        [product.variants, optionCodes],
    );

    const [quantity, setQuantity] = useState(DEVICE_QUANTITY_RULES.defaultQty);
    const [plan, setPlan] = useState<AddOnPlan>(() => buildAddOnPlan({
        product,
        selectedVariant: product.variants[0],
        urlYear,
        extraBrands,
        selections: DEFAULT_SELECTIONS,
        addOnProducts,
        deviceQuantity: DEVICE_QUANTITY_RULES.defaultQty,
    }));
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleConfiguratorChange = useCallback((nextPlan: AddOnPlan) => {
        setPlan(nextPlan);
    }, []);

    const blockingMessage = (warning: AddOnPlanWarning): string => {
        switch (warning) {
        case 'extension-brand-missing':
            return t('warnings.extensionBrandMissing');
        case 'elite-mixed-invalid':
            return t('warnings.eliteMixedInvalid', {min: ELITE_MIXED_MIN_BRANDS});
        default:
            return t('cart.error');
        }
    };

    const submit = () => {
        if (!selectedVariant) {
            return;
        }
        const safeQuantity = sanitizePurchaseQuantity(quantity, DEVICE_QUANTITY_RULES);
        const lines = buildCartLines(product, selectedVariant, safeQuantity, plan);
        const addOnCount = plan.lines.length;

        startTransition(async () => {
            const result = await addConfiguredItemsAction(lines);

            if (!result.success) {
                toast.error(tProduct('errorTitle'), {description: result.error});
                return;
            }

            toast.success(
                addOnCount > 0
                    ? t('cart.addedWithAddOns', {name: product.name, count: addOnCount})
                    : t('cart.added', {name: product.name}),
                {
                    action: {
                        label: t('cart.viewCart'),
                        onClick: () => router.push('/cart'),
                    },
                },
            );

            if (result.partialError) {
                toast.warning(t('cart.partialError', {message: result.partialError}));
            }
        });
    };

    const handleAddToCart = () => {
        if (isPlanBlocked(plan)) {
            plan.warnings
                .filter((warning) => BLOCKING_WARNINGS.includes(warning))
                .forEach((warning) => toast.error(blockingMessage(warning)));
            return;
        }

        if (plan.warnings.some((warning) => CONFIRM_WARNINGS.includes(warning))) {
            setConfirmOpen(true);
            return;
        }

        submit();
    };

    const quantityItems = Object.fromEntries(DEVICE_QUANTITY_OPTIONS.map((value) => [String(value), String(value)]));
    const hasAddOns = plan.totalAddOnsNet > 0;

    return (
        <div className="flex flex-col">
            <EliteNoSgwConfirmDialog
                open={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => {
                    setConfirmOpen(false);
                    submit();
                }}
            />

            <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground lg:text-4xl">{product.name}</h1>

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="mr-1 size-3.5" aria-hidden="true" /> {t('product.inStock')}
                </span>
                {selectedVariant && (
                    <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                        {t('product.articleNumber', {sku: selectedVariant.sku})}
                    </span>
                )}
            </div>

            <div className="space-y-5">
                {/* Variant radios only where the product has real options (licences: duration). */}
                {optionGroups.length > 0 && (
                    <div className="space-y-5">
                        {optionGroups.map((group) => (
                            <div key={group.code}>
                                <div className="mb-2 text-sm font-bold">{group.name}</div>
                                <RadioGroup
                                    value={optionCodes[group.code] ?? ''}
                                    onValueChange={(value) => setOptionCodes((previous) => ({...previous, [group.code]: String(value)}))}
                                >
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {group.options.map((option) => {
                                            const radioId = `variant-${group.code}-${option.code}`;
                                            return (
                                                <div key={option.code}>
                                                    <RadioGroupItem value={option.code} id={radioId} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={radioId}
                                                        className="block cursor-pointer rounded-md border border-border p-3 text-left transition-all hover:border-primary/50 peer-data-[checked]:border-primary peer-data-[checked]:bg-primary/5 peer-data-[checked]:ring-1 peer-data-[checked]:ring-primary"
                                                    >
                                                        <span className="block text-sm font-bold text-foreground">{option.name}</span>
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </RadioGroup>
                            </div>
                        ))}
                        {selectedVariant && (
                            <p className="text-sm text-muted-foreground">
                                {t('variant.price')}
                                {' '}
                                <Price value={selectedVariant.priceNet} className="font-semibold text-foreground" />
                            </p>
                        )}
                    </div>
                )}

                {selectedVariant && (
                    <ProductConfigurator
                        product={product}
                        selectedVariant={selectedVariant}
                        urlYear={urlYear}
                        extraBrands={extraBrands}
                        addOnProducts={addOnProducts}
                        locale={locale}
                        deviceQuantity={quantity}
                        onChange={handleConfiguratorChange}
                    />
                )}

                {/* Live total: device x quantity + all configured add-ons, NET. */}
                <div>
                    <div className="text-4xl font-bold leading-none text-foreground">
                        <Price value={plan.liveTotalNet} />
                    </div>
                    <VatNote className="mt-2 block text-sm text-muted-foreground" />
                    {hasAddOns && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('summary.liveTotal', {
                                device: formatMoney(plan.deviceTotalNet, displayCurrency, priceLocale),
                                addOns: formatMoney(plan.totalAddOnsNet, displayCurrency, priceLocale),
                            })}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                        items={quantityItems}
                        value={String(quantity)}
                        onValueChange={(value) => setQuantity(sanitizePurchaseQuantity(Number(value), DEVICE_QUANTITY_RULES))}
                    >
                        <SelectTrigger className="h-12 w-24 shrink-0 bg-background font-bold data-[size=default]:h-12" aria-label={t('cart.quantity')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DEVICE_QUANTITY_OPTIONS.map((value) => (
                                <SelectItem key={value} value={String(value)}>{value}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        size="lg"
                        className="h-12 flex-1 rounded-md text-base font-bold"
                        disabled={!selectedVariant || isPending}
                        onClick={handleAddToCart}
                    >
                        <ShoppingCart className="mr-2 size-5" aria-hidden="true" />
                        {isPending ? t('cart.adding') : t('cart.addToCart')}
                    </Button>
                </div>

                <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm">
                    <Truck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                        <p className="font-semibold text-foreground">{t('product.shippingTitle')}</p>
                        <p className="text-muted-foreground">{t('product.shippingTime')}</p>
                    </div>
                </div>

                {highlights.length > 0 && (
                    <div>
                        <h2 className="mb-2 text-base font-bold text-foreground">{t('product.highlights')}</h2>
                        <ul className="space-y-1.5">
                            {highlights.map((highlight) => (
                                <li key={highlight.key} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                                    <Check className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                                    <span>
                                        {highlight.key in HIGHLIGHT_BULLETS ? t(`highlights.${highlight.key}`) : highlight.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConfigurableProductPanel;
