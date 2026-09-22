import {Package, RefreshCw, ShieldCheck, Truck, Wrench, type LucideIcon} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {MarketingSection} from '@/components/marketing/section';

interface BenefitsProps {
    locale: string;
}

type BenefitKey = 'sgw' | 'coverage' | 'shippingCh' | 'shippingDe' | 'updates';

const BENEFITS: ReadonlyArray<{key: BenefitKey; icon: LucideIcon}> = [
    {key: 'sgw', icon: ShieldCheck},
    {key: 'coverage', icon: Wrench},
    {key: 'shippingCh', icon: Package},
    {key: 'shippingDe', icon: Truck},
    {key: 'updates', icon: RefreshCw},
];

/** The five USP cards from the previous storefront's BlockBenefits (copy unchanged). */
export async function Benefits({locale}: BenefitsProps) {
    const t = await getTranslations({locale, namespace: 'HomePage.benefits'});

    return (
        <MarketingSection tone="alt" title={t('title')}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {BENEFITS.map(({key, icon: Icon}) => (
                    <li key={key} className="flex h-full flex-col rounded-md border border-slate-200 bg-slate-50 p-5">
                        <span className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-bold text-foreground">{t(`${key}Title`)}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{t(`${key}Text`)}</p>
                    </li>
                ))}
            </ul>
        </MarketingSection>
    );
}
