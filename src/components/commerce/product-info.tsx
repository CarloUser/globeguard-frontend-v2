'use client';

import {useState, useMemo, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {ShoppingCart, CheckCircle2, Star, Heart, Package, ShieldCheck, Truck, CreditCard, Headphones, SearchCheck} from 'lucide-react';
import {addToCart} from '@/app/[locale]/product/[slug]/actions';
import {toast} from 'sonner';
import {Price} from '@/components/commerce/price';
import {useTranslations} from 'next-intl';
import {getProductVisualKind, getProductVisualLabel} from '@/components/commerce/product-visual';

interface ProductInfoProps {
    product: {
        id: string;
        name: string;
        description: string;
        variants: Array<{
            id: string;
            name: string;
            sku: string;
            priceWithTax: number;
            stockLevel: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
                groupId: string;
                group: {
                    id: string;
                    code: string;
                    name: string;
                };
            }>;
        }>;
        optionGroups: Array<{
            id: string;
            code: string;
            name: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
            }>;
        }>;
    };
    searchParams: { [key: string]: string | string[] | undefined };
    currencyCode: string;
}

export function ProductInfo({product, searchParams, currencyCode}: ProductInfoProps) {
    const t = useTranslations('Product');
    const pathname = usePathname();
    const router = useRouter();
    const currentSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isAdded, setIsAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const visualKind = getProductVisualKind(product.name);

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};

        product.optionGroups.forEach((group) => {
            const paramValue = searchParams[group.code];
            if (typeof paramValue === 'string') {
                const option = group.options.find((opt) => opt.code === paramValue);
                if (option) {
                    initialOptions[group.id] = option.id;
                }
            }
        });

        return initialOptions;
    });

    const selectedVariant = useMemo(() => {
        if (product.variants.length === 1) {
            return product.variants[0];
        }

        if (Object.keys(selectedOptions).length !== product.optionGroups.length) {
            return null;
        }

        return product.variants.find((variant) => {
            const variantOptionIds = variant.options.map((opt) => opt.id);
            const selectedOptionIds = Object.values(selectedOptions);
            return selectedOptionIds.every((optId) => variantOptionIds.includes(optId));
        });
    }, [selectedOptions, product.variants, product.optionGroups]);

    const handleOptionChange = (groupId: string, optionId: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [groupId]: optionId,
        }));

        const group = product.optionGroups.find((g) => g.id === groupId);
        const option = group?.options.find((opt) => opt.id === optionId);

        if (group && option) {
            const params = new URLSearchParams(currentSearchParams);
            params.set(group.code, option.code);
            router.push(`${pathname}?${params.toString()}`, {scroll: false});
        }
    };

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        startTransition(async () => {
            const result = await addToCart(selectedVariant.id, quantity);

            if (result.success) {
                setIsAdded(true);
                toast.success(t('addedToCartMessage'), {
                    description: t('addedToCartDescription', {name: product.name}),
                });

                setTimeout(() => setIsAdded(false), 2000);
            } else {
                toast.error(t('errorTitle'), {
                    description: result.error || t('errorAddToCart'),
                });
            }
        });
    };

    const isInStock = Boolean(selectedVariant && selectedVariant.stockLevel !== 'OUT_OF_STOCK');
    const canAddToCart = Boolean(selectedVariant && isInStock);
    const isDigitalProduct = /(software|update|license|lizenz|sgw|gateway|remote|support)/i.test(product.name);
    const plainDescription = product.description.replace(/<[^>]+>/g, '').trim();
    const shouldShowDescription = Boolean(plainDescription && plainDescription.toLowerCase() !== t('pricesExcludeVat').toLowerCase());

    return (
        <div className="flex flex-col">
            <div className="text-mono-label mb-2 text-primary">GlobeGuard / {getProductVisualLabel(visualKind)}</div>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-[#101820] dark:text-white lg:text-4xl">{product.name}</h1>

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex text-amber-500" aria-label={t('starRating')}>
                    {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="size-4 fill-current" />)}
                </div>
                <span className="text-sm font-medium text-slate-500">{t('diagnosticProduct')}</span>
                {selectedVariant && (
                    <span className={`flex items-center rounded-full px-2 py-0.5 text-sm font-bold ${isInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-destructive'}`}>
                        <CheckCircle2 className="mr-1 size-3.5" /> {isInStock ? t('inStock') : t('outOfStock')}
                    </span>
                )}
            </div>

            {shouldShowDescription && (
                <div className="mb-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{__html: product.description}} />
            )}

            <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm text-slate-500">{t('pricesExcludeVat')}</p>
                        {selectedVariant && (
                            <div className="mt-1 text-4xl font-bold leading-none text-[#101820] dark:text-white">
                                <Price value={selectedVariant.priceWithTax} currencyCode={currencyCode}/>
                            </div>
                        )}
                    </div>
                    {selectedVariant && <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{t('sku', {sku: selectedVariant.sku})}</span>}
                </div>

                {product.optionGroups.length > 0 && (
                    <div className="space-y-5">
                        {product.optionGroups.map((group) => (
                            <div key={group.id}>
                                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                                    <span>{group.name}</span>
                                </div>
                                <RadioGroup
                                    value={selectedOptions[group.id] || ''}
                                    onValueChange={(value) => handleOptionChange(group.id, value)}
                                >
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {group.options.map((option) => (
                                            <div key={option.id}>
                                                <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                                                <Label
                                                    htmlFor={option.id}
                                                    className="block cursor-pointer rounded-md border border-slate-200 p-3 text-left transition-all hover:border-primary/50 peer-data-[checked]:border-primary peer-data-[checked]:bg-primary/5 peer-data-[checked]:ring-1 peer-data-[checked]:ring-primary dark:border-white/10"
                                                >
                                                    <div className="text-sm font-bold text-[#101820] dark:text-white">{option.name}</div>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex h-12 shrink-0 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-[#101820] dark:border-white/10 dark:bg-white/5 dark:text-white">
                        <span className="sr-only">{t('quantity')}</span>
                        <select
                            value={quantity}
                            onChange={(event) => setQuantity(Number(event.target.value))}
                            className="bg-transparent pr-7 font-bold outline-none"
                            aria-label={t('quantity')}
                        >
                            {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <Button
                        size="lg"
                        className="btn-primary h-12 flex-1 rounded-md text-base font-bold"
                        disabled={!canAddToCart || isPending}
                        onClick={handleAddToCart}
                    >
                        {isAdded ? (
                            <>
                                <CheckCircle2 className="mr-2 size-5"/>
                                {t('addedToCart')}
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="mr-2 size-5"/>
                                {isPending
                                    ? t('adding')
                                    : !selectedVariant && product.optionGroups.length > 0
                                        ? t('selectOptions')
                                        : !isInStock
                                            ? t('outOfStock')
                                            : t('addToCart')}
                            </>
                        )}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-14 rounded-md border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" aria-label={t('addToWishlist')}>
                        <Heart className="size-5 text-slate-400 transition-colors" />
                    </Button>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <div className="flex gap-2">
                        <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{isDigitalProduct ? t('digitalStockLine') : t('stockLine')}</span>
                    </div>
                    <div className="flex gap-2">
                        <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{t('securePayment')}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
                    <div className="mb-2 flex items-center gap-2 font-bold text-[#101820] dark:text-white">
                        <SearchCheck className="size-4 text-primary" />
                        {t('brandLevelCoverage')}
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{t('brandLevelCoverageBody')}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
                    <div className="mb-2 flex items-center gap-2 font-bold text-[#101820] dark:text-white">
                        <Headphones className="size-4 text-primary" />
                        {t('remoteSetup')}
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{t('remoteSetupBody')}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/5 pt-4 text-sm font-medium text-slate-500 dark:border-white/10">
                <span className="flex items-center"><ShieldCheck className="mr-2 size-4" /> {t('compatibilitySupport')}</span>
                <span className="flex items-center"><Package className="mr-2 size-4" /> {t('adapterEcosystem')}</span>
            </div>
        </div>
    );
}