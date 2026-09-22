'use client';

import {useMemo, useState} from 'react';
import Image from 'next/image';
import {Package} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Price, VatNote} from '@/components/commerce/price';
import {VehicleTypeBadge} from '@/components/configurator/vehicle-type-badge';
import {Link} from '@/i18n/navigation';
import {
    ELITE_DEVICES,
    ELITE_VEHICLE_TYPES,
    getEliteDevicesForVehicleType,
    localizedLabel,
    skuToProductSlug,
} from '@/lib/globeguard/picker';
import type {CatalogProduct} from '@/lib/globeguard/types';
import {cn} from '@/lib/utils';

/**
 * ELITE device router (/produkte/elite): the customer picks the vehicle class of the
 * business; device cards that do not serve that class are dimmed. Bus and Truck/Trailer
 * are deliberately separate here (a Bus customer must never land on Truck/Trailer).
 *
 * Ported from the previous storefront (src/pages/produkte/elite.tsx). Card texts are
 * short page-local copy; the full description lives on the product page.
 */

/** Translation key (Tiers.elite.devices.*) of each ELITE device SKU. */
const DEVICE_TEXT_KEYS: Record<string, string> = {
    'GG-ELITE-CARS-MX': 'carsMixed',
    'GG-ELITE-CARS-MB': 'carsMultibrand',
    'GG-ELITE-MOTO-MB': 'motoMultibrand',
    'GG-ELITE-BUS-MB': 'busMultibrand',
    'GG-ELITE-TRUCK-MB': 'truckMultibrand',
    'GG-ELITE-FULL-MB': 'fullMultibrand',
};

export interface EliteDeviceChooserProps {
    /** Products of the ELITE, ELITE_CARS_MIXED_10 and ELITE_FULL tiers, mapped with `toCatalogProducts`. */
    products: CatalogProduct[];
    locale: string;
    /** Featured-asset preview URL per product slug (the domain product type carries no assets). */
    images?: Record<string, string | null | undefined>;
    className?: string;
}

function DeviceImage({src, alt, sku}: {src: string | null | undefined; alt: string; sku: string}) {
    return (
        <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-200 bg-white">
            {src ? (
                <Image
                    src={src.replace(/\\/g, '/')}
                    alt={alt}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
            ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground" aria-hidden="true">
                    <Package className="size-8" strokeWidth={1.5} />
                </div>
            )}
            <VehicleTypeBadge sku={sku} className="right-2 top-2 size-10 bg-white/90 shadow-none" />
        </div>
    );
}

export function EliteDeviceChooser({products, locale, images, className}: EliteDeviceChooserProps) {
    const t = useTranslations('Tiers.elite');
    const [vehicleTypeKey, setVehicleTypeKey] = useState('');

    const productBySlug = useMemo(() => {
        const map = new Map<string, CatalogProduct>();
        for (const product of products) {
            map.set(product.slug, product);
        }
        return map;
    }, [products]);

    const highlightedSkus = useMemo(
        () => new Set(vehicleTypeKey ? getEliteDevicesForVehicleType(vehicleTypeKey).map((device) => device.sku) : []),
        [vehicleTypeKey],
    );

    return (
        <div className={cn('space-y-8', className)}>
            <fieldset className="rounded-md border border-slate-200 bg-white p-5 md:p-8">
                <legend className="text-lg font-bold text-foreground">{t('stepTitle')}</legend>
                <div role="group" aria-label={t('vehicleTypeGroup')} className="mt-3 flex flex-wrap gap-2">
                    {ELITE_VEHICLE_TYPES.map((entry) => {
                        const active = vehicleTypeKey === entry.key;
                        return (
                            <button
                                key={entry.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setVehicleTypeKey(entry.key)}
                                className={cn(
                                    'rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    active
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-300 bg-white text-foreground hover:border-slate-900',
                                )}
                            >
                                {localizedLabel(entry, locale)}
                            </button>
                        );
                    })}
                </div>
                {vehicleTypeKey === 'bus' && <p className="mt-3 text-sm leading-6 text-slate-600">{t('busHint')}</p>}
            </fieldset>

            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ELITE_DEVICES.map((device) => {
                    const slug = skuToProductSlug(device.sku);
                    const product = productBySlug.get(slug);
                    const price = product?.variants[0]?.priceNet ?? null;
                    const isHighlighted = highlightedSkus.has(device.sku);
                    const isDimmed = vehicleTypeKey !== '' && !isHighlighted;
                    const textKey = DEVICE_TEXT_KEYS[device.sku];
                    const name = product?.name || localizedLabel(device, locale);

                    return (
                        <li
                            key={device.sku}
                            className={cn(
                                'flex flex-col overflow-hidden rounded-md border bg-white transition-opacity',
                                isHighlighted ? 'border-slate-900 shadow-sm' : 'border-slate-200',
                                isDimmed && 'opacity-45',
                            )}
                            aria-current={isHighlighted ? 'true' : undefined}
                        >
                            <DeviceImage src={images?.[slug]} alt={name} sku={device.sku} />
                            <div className="flex flex-1 flex-col p-5">
                                {isHighlighted && (
                                    <span className="text-mono-label mb-2 inline-flex w-fit rounded-sm bg-slate-900 px-2 py-1 text-white">
                                        {t('matchesSelection')}
                                    </span>
                                )}
                                <h2 className="text-lg font-bold text-foreground">{name}</h2>
                                {textKey && <p className="mt-2 text-sm leading-6 text-slate-600">{t(`devices.${textKey}`)}</p>}
                                <div className="mt-auto pt-5">
                                    {price !== null && (
                                        <div className="mb-4">
                                            <Price value={price} className="text-2xl font-bold text-foreground" />
                                            <VatNote className="ml-2 text-xs text-slate-500" />
                                        </div>
                                    )}
                                    <Link
                                        href={`/products/${slug}`}
                                        className={cn('w-full', isHighlighted ? 'btn-primary' : 'btn-secondary')}
                                    >
                                        {t('toDevice')}
                                    </Link>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
