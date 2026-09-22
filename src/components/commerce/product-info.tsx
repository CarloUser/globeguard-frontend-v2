'use client';

import {useMemo, useState, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {CheckCircle2, ShoppingCart} from 'lucide-react';
import {addToCart} from '@/app/[locale]/products/[slug]/actions';
import {toast} from 'sonner';
import {Price, VatNote} from '@/components/commerce/price';
import {ORDER_CURRENCY} from '@/lib/display-currency';
import {useTranslations} from 'next-intl';

interface ProductInfoProps {
    product: {
        id: string;
        name: string;
        description: string;
        variants: Array<{
            id: string;
            name: string;
            sku: string;
            /** NET price in minor units (CHF). */
            price: number;
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
    /** Currency of the variant prices. Orders are CHF-only; optional for call-site compatibility. */
    currencyCode?: string;
}

/**
 * Product purchase panel: NET price + VAT note, variant option radios, quantity and add-to-cart.
 * The device configurator (tier / brand group / year) replaces the plain option radios in Phase 2c.
 */
export function ProductInfo({product, searchParams, currencyCode = ORDER_CURRENCY}: ProductInfoProps) {
    const t = useTranslations('Product');
    const pathname = usePathname();
    const router = useRouter();
    const currentSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isAdded, setIsAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);

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
    const plainDescription = product.description.replace(/<[^>]+>/g, '').trim();

    return (
        <div className="flex flex-col">
            <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground lg:text-4xl">{product.name}</h1>

            {selectedVariant && (
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className={`flex items-center rounded-full px-2 py-0.5 text-sm font-bold ${isInStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-destructive'}`}>
                        <CheckCircle2 className="mr-1 size-3.5" /> {isInStock ? t('inStock') : t('outOfStock')}
                    </span>
                    <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{t('sku', {sku: selectedVariant.sku})}</span>
                </div>
            )}

            {plainDescription && (
                <div className="mb-5 max-w-2xl text-base leading-7 text-muted-foreground" dangerouslySetInnerHTML={{__html: product.description}} />
            )}

            <div className="space-y-5">
                {selectedVariant && (
                    <div>
                        <div className="text-4xl font-bold leading-none text-foreground">
                            <Price value={selectedVariant.price} currencyCode={currencyCode}/>
                        </div>
                        <VatNote className="mt-2 block text-sm text-muted-foreground" />
                    </div>
                )}

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
                                        {group.options.map((option) => {
                                            // Namespaced so the raw Vendure entity id cannot collide with
                                            // another DOM id on the page (same rule as payment-step.tsx).
                                            const optionId = `product-option-${option.id}`;

                                            return (
                                                <div key={option.id}>
                                                    <RadioGroupItem value={option.id} id={optionId} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={optionId}
                                                        className="block cursor-pointer rounded-md border border-border p-3 text-left transition-all hover:border-primary/50 peer-data-[checked]:border-primary peer-data-[checked]:bg-primary/5 peer-data-[checked]:ring-1 peer-data-[checked]:ring-primary"
                                                    >
                                                        <div className="text-sm font-bold text-foreground">{option.name}</div>
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </RadioGroup>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex h-12 shrink-0 items-center rounded-md border border-border bg-background px-3 text-sm font-bold text-foreground">
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
                        className="h-12 flex-1 rounded-md text-base font-bold"
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
                </div>
            </div>
        </div>
    );
}
