'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {ClipboardList, Clock, CreditCard, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Spinner} from '@/components/ui/spinner';
import {Link, useRouter} from '@/i18n/navigation';
import {getOrderPaymentState} from './actions';

/** Order states in which the payment has not been settled or authorised yet. */
export const PENDING_ORDER_STATES: readonly string[] = ['AddingItems', 'ArrangingPayment'];

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

type Phase = 'polling' | 'timeout' | 'resolved';

interface PaymentPendingStatusProps {
    code: string;
}

/**
 * Header of the confirmation page while the order is still in ArrangingPayment: the
 * customer usually lands here from Mollie's hosted checkout BEFORE the webhook has settled
 * the payment. Polls orderByCode every 2 s for up to 30 s; once the order leaves the pending
 * states the server component is refreshed and renders the final state. After the timeout
 * (slow webhook, or a payment the customer cancelled at Mollie, which the plugin ignores)
 * it shows "Zahlung wird noch bestätigt" with the order code, a refresh button and the way
 * back to the checkout. The first poll also invalidates the cart tags.
 */
export function PaymentPendingStatus({code}: PaymentPendingStatusProps) {
    const t = useTranslations('Payment');
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>('polling');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let invalidateCart = attempt === 0;
        const deadline = Date.now() + POLL_TIMEOUT_MS;

        const tick = async () => {
            let state: string | null = null;
            try {
                const result = await getOrderPaymentState(code, {invalidateCart});
                state = result?.state ?? null;
            } catch (error) {
                console.warn('Order confirmation: could not read the order state, retrying', error);
            }
            invalidateCart = false;

            if (cancelled) {
                return;
            }

            if (state && !PENDING_ORDER_STATES.includes(state)) {
                setPhase('resolved');
                router.refresh();
                return;
            }

            if (Date.now() >= deadline) {
                setPhase('timeout');
                return;
            }

            timer = setTimeout(() => {
                void tick();
            }, POLL_INTERVAL_MS);
        };

        void tick();

        return () => {
            cancelled = true;
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [attempt, code, router]);

    const restart = () => {
        setPhase('polling');
        setAttempt((current) => current + 1);
    };

    if (phase !== 'timeout') {
        return (
            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-muted p-5">
                        <Spinner className="size-10 text-muted-foreground" />
                    </div>
                </div>
                <h1 className="mb-2 text-3xl font-bold">{t('confirmation.checkingTitle')}</h1>
                <p className="text-muted-foreground">{t('confirmation.checkingText')}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t('confirmation.orderCode')}: <span className="font-semibold text-foreground">{code}</span>
                </p>
            </div>
        );
    }

    return (
        <div className="text-center">
            <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-muted p-5">
                    <Clock className="h-10 w-10 text-muted-foreground" strokeWidth={2.5} />
                </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold">{t('confirmation.stillPendingTitle')}</h1>
            <p className="mx-auto max-w-xl text-muted-foreground">{t('confirmation.stillPendingText')}</p>
            <p className="mt-2 text-sm text-muted-foreground">
                {t('confirmation.orderCode')}: <span className="font-semibold text-foreground">{code}</span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button type="button" size="lg" onClick={restart}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('confirmation.refresh')}
                </Button>
                <Button nativeButton={false} render={<Link href="/checkout" />} variant="outline" size="lg">
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('confirmation.retryPayment')}
                </Button>
                <Button nativeButton={false} render={<Link href="/account/orders" />} variant="outline" size="lg">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {t('confirmation.viewOrders')}
                </Button>
            </div>
        </div>
    );
}
