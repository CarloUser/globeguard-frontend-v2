import {Mail, MapPin} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {globeguardCompany} from '@/content/globeguard';
import {cn} from '@/lib/utils';

interface CompanyContactBlockProps {
    locale: string;
    className?: string;
    /** Render the "write an e-mail" button below the address (default: true). */
    showEmailButton?: boolean;
}

/**
 * Verified company contact block (name, address, e-mail, VAT number) used as the aside of
 * every legal/company page. Facts come from `globeguardCompany`; nothing else is added.
 */
export async function CompanyContactBlock({locale, className, showEmailButton = true}: CompanyContactBlockProps) {
    const t = await getTranslations({locale, namespace: 'Legal.common'});
    const {name, address, email, vat} = globeguardCompany;

    return (
        <div className={cn('rounded-md border border-slate-200 bg-white p-5', className)}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t('contactHeading')}</h2>
            <p className="mt-2 font-bold text-foreground">{name}</p>
            <div className="mt-4 space-y-4 text-sm">
                <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                        <div className="font-semibold text-foreground">{t('address')}</div>
                        <address className="mt-1 not-italic leading-6 text-slate-600">
                            {address.street}
                            <br />
                            {address.postalCode} {address.city}
                            <br />
                            {address.country}
                        </address>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                        <div className="font-semibold text-foreground">{t('email')}</div>
                        <a href={'mailto:' + email} className="mt-1 inline-flex text-primary hover:underline">
                            {email}
                        </a>
                    </div>
                </div>
                <div className="text-xs text-slate-500">
                    {t('vat')} {vat}
                </div>
            </div>
            {showEmailButton && (
                <a href={'mailto:' + email} className="btn-primary mt-6 inline-flex w-full sm:w-auto">
                    <Mail className="mr-2 size-4" />
                    {t('writeEmail')}
                </a>
            )}
        </div>
    );
}
