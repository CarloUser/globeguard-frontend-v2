import Image from 'next/image';
import {useTranslations} from 'next-intl';

import {vehicleTypeFromSku, vehicleTypeIconPath} from '@/lib/globeguard/vehicle-type';
import {cn} from '@/lib/utils';

export interface VehicleTypeBadgeProps {
    sku: string | null | undefined;
    /** Position / size overrides; the default sits in the top-right corner of a `relative` parent. */
    className?: string;
}

/**
 * Small vehicle-type icon for the corner of product hero images (product page gallery,
 * listing cards) so customers can tell at a glance which vehicle class a device serves.
 * Renders nothing for SKUs without a vehicle type (licences, cables, updates).
 * Icons: owner-provided flat silhouettes in public/images/vehicle-types/.
 */
export function VehicleTypeBadge({sku, className}: VehicleTypeBadgeProps) {
    const t = useTranslations('Configurator.vehicleTypes');
    const type = vehicleTypeFromSku(sku);

    if (!type) {
        return null;
    }

    const label = t(type);

    return (
        <span
            role="img"
            aria-label={label}
            title={label}
            className={cn(
                'pointer-events-none absolute right-3 top-3 z-10 flex size-12 items-center justify-center rounded-md border border-slate-200 bg-white/95 shadow-sm',
                className,
            )}
        >
            <Image
                src={vehicleTypeIconPath(type)}
                alt=""
                width={40}
                height={40}
                className="size-[82%] object-contain"
            />
        </span>
    );
}

export default VehicleTypeBadge;
