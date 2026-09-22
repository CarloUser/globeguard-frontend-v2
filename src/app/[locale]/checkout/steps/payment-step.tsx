'use client';

import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {CreditCard, ExternalLink, FileText, Info} from 'lucide-react';
import {
    isMolliePaymentMethod,
    type MolliePaymentMethodSummary,
} from '@/components/checkout/payment-method-codes';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Link} from '@/i18n/navigation';
import {useCheckout} from '../checkout-provider';

interface PaymentStepProps {
    onComplete: () => void;
}

/** Logos of the Mollie methods enabled on the profile (TWINT, card, PostFinance, ...). */
function MollieMethodLogos({methods, label}: {methods: MolliePaymentMethodSummary[]; label: string}) {
    if (methods.length === 0) {
        return null;
    }

    return (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label={label}>
            {methods.map((method) => {
                const src = method.imageSvg ?? method.image2x ?? method.image1x;
                const name = method.description ?? method.code;
                return (
                    <li
                        key={method.code}
                        className="flex h-8 items-center rounded border border-border bg-background px-1.5"
                        title={name}
                    >
                        {src ? (
                            // Mollie-hosted logos: bypass the image optimizer (no remotePattern needed).
                            <Image src={src} alt={name} width={32} height={24} unoptimized className="h-6 w-auto" />
                        ) : (
                            <span className="text-xs text-muted-foreground">{name}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * Payment step (decision A5/O5): the 'mollie' method is ONE tile "Online bezahlen" with
 * the backend description, the Mollie method logos and a note that the payment page opens
 * at Mollie; 'invoice' (approved company customers) is a plain tile with name/description.
 * Without any eligible method the customer gets an explanation instead of an empty list.
 */
export default function PaymentStep({onComplete}: PaymentStepProps) {
    const t = useTranslations('Checkout');
    const tPayment = useTranslations('Payment');
    const {paymentMethods, mollieMethods, selectedPaymentMethodCode, setSelectedPaymentMethodCode} = useCheckout();

    const handleContinue = () => {
        if (!selectedPaymentMethodCode) return;
        onComplete();
    };

    if (paymentMethods.length === 0) {
        return (
            <Alert>
                <Info />
                <AlertTitle>{tPayment('noMethods.title')}</AlertTitle>
                <AlertDescription>
                    <p>{tPayment('noMethods.text')}</p>
                    <p>
                        {tPayment('noMethods.contact')}{' '}
                        <Link href="/kontakt" className="font-medium underline underline-offset-3">
                            {tPayment('noMethods.contactLink')}
                        </Link>
                    </p>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="font-semibold">{t('selectPaymentMethod')}</h3>

            <RadioGroup value={selectedPaymentMethodCode || ''} onValueChange={setSelectedPaymentMethodCode}>
                {paymentMethods.map((method) => {
                    const online = isMolliePaymentMethod(method.code);
                    const Icon = online ? CreditCard : FileText;
                    const inputId = `payment-method-${method.code}`;

                    return (
                        <Label key={method.code} htmlFor={inputId} className="cursor-pointer">
                            <Card className="w-full p-4">
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value={method.code} id={inputId} className="mt-0.5" />
                                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{online ? tPayment('online.title') : method.name}</p>
                                        {online ? (
                                            <>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {method.description || tPayment('online.description')}
                                                </p>
                                                <MollieMethodLogos
                                                    methods={mollieMethods}
                                                    label={tPayment('online.methodsLabel')}
                                                />
                                                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                                                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                    <span>{tPayment('online.redirectNote')}</span>
                                                </p>
                                            </>
                                        ) : (
                                            method.description && (
                                                <p className="mt-1 text-sm text-muted-foreground">{method.description}</p>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Label>
                    );
                })}
            </RadioGroup>

            <Button onClick={handleContinue} disabled={!selectedPaymentMethodCode} className="w-full">
                {t('continueToReview')}
            </Button>
        </div>
    );
}
