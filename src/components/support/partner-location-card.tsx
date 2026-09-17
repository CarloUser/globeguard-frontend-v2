import {CalendarCheck, Clock, ExternalLink, MapPin, Phone} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Badge} from '@/components/ui/badge';
import {isStoreLocationType, type StoreLocation} from '@/lib/vendure/store-locator';

function telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * One partner location from the store-locator plugin. Renders only what the entity
 * carries (name, type, address, hours, phone, optional booking/details URLs); no map.
 */
export function PartnerLocationCard({location}: {location: StoreLocation}) {
    const t = useTranslations('PartnerLocator');
    const type = isStoreLocationType(location.type) ? location.type : 'store';
    const phone = location.phone.trim();
    const hours = location.hours.trim();

    return (
        <article className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-foreground">{location.name}</h3>
                <Badge variant="secondary">{t(`types.${type}`)}</Badge>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
                <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                        <dt className="font-semibold text-foreground">{t('address')}</dt>
                        <dd className="mt-0.5 whitespace-pre-line leading-6 text-slate-600">{location.address}</dd>
                    </div>
                </div>
                {hours && (
                    <div className="flex gap-3">
                        <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                            <dt className="font-semibold text-foreground">{t('hours')}</dt>
                            <dd className="mt-0.5 whitespace-pre-line leading-6 text-slate-600">{hours}</dd>
                        </div>
                    </div>
                )}
                {phone && (
                    <div className="flex gap-3">
                        <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                            <dt className="font-semibold text-foreground">{t('phone')}</dt>
                            <dd className="mt-0.5">
                                <a href={telHref(phone)} className="text-primary hover:underline">
                                    {phone}
                                </a>
                            </dd>
                        </div>
                    </div>
                )}
            </dl>

            {(location.bookingUrl || location.detailsUrl) && (
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {location.bookingUrl && (
                        <a href={location.bookingUrl} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                            <CalendarCheck className="mr-2 size-4" />
                            {t('booking')}
                        </a>
                    )}
                    {location.detailsUrl && (
                        <a href={location.detailsUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                            <ExternalLink className="mr-2 size-4" />
                            {t('details')}
                        </a>
                    )}
                </div>
            )}
        </article>
    );
}
