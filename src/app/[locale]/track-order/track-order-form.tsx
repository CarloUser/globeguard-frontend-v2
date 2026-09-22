'use client';

import {useState, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {AlertCircle, PackageSearch, SearchX} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import type {TrackOrderResult} from '@/lib/vendure/order-tracking';
import {trackOrderAction} from './actions';
import {TrackedOrderView} from './tracked-order-view';

interface TrackOrderFormData {
    orderCode: string;
    emailAddress: string;
}

/**
 * Order code + e-mail form. The server action answers with a discriminated result; "not found"
 * never says which of the two inputs was wrong (backend contract), and the backend's rate limit
 * is shown as its own notice.
 */
export function TrackOrderForm() {
    const t = useTranslations('Tracking');
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<TrackOrderResult | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<TrackOrderFormData>({
        defaultValues: {orderCode: '', emailAddress: ''},
    });

    const onSubmit = (data: TrackOrderFormData) => {
        startTransition(async () => {
            try {
                setResult(await trackOrderAction(data.orderCode, data.emailAddress));
            } catch {
                setResult({status: 'error'});
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="orderCode">{t('orderCode')}</FieldLabel>
                                <Input
                                    id="orderCode"
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                    placeholder={t('orderCodePlaceholder')}
                                    disabled={isPending}
                                    className="font-mono"
                                    {...register('orderCode', {
                                        required: t('orderCodeRequired'),
                                        setValueAs: (value: string) => String(value ?? '').trim(),
                                    })}
                                />
                                <FieldError>{errors.orderCode?.message}</FieldError>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="emailAddress">{t('emailAddress')}</FieldLabel>
                                <Input
                                    id="emailAddress"
                                    type="email"
                                    autoComplete="email"
                                    disabled={isPending}
                                    {...register('emailAddress', {
                                        required: t('emailRequired'),
                                        setValueAs: (value: string) => String(value ?? '').trim(),
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                                            message: t('emailInvalid'),
                                        },
                                    })}
                                />
                                <FieldError>{errors.emailAddress?.message}</FieldError>
                            </Field>

                            <Button type="submit" className="mt-2 w-full" disabled={isPending}>
                                <PackageSearch className="mr-2 h-4 w-4" aria-hidden="true" />
                                {isPending ? t('submitting') : t('submit')}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            <div aria-live="polite">
                {result?.status === 'found' && <TrackedOrderView order={result.order} />}

                {result?.status === 'not-found' && (
                    <Alert>
                        <SearchX className="h-4 w-4" aria-hidden="true" />
                        <AlertTitle>{t('notFoundTitle')}</AlertTitle>
                        <AlertDescription>{t('notFoundBody')}</AlertDescription>
                    </Alert>
                )}

                {result?.status === 'too-many-attempts' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        <AlertTitle>{t('tooManyAttemptsTitle')}</AlertTitle>
                        <AlertDescription>{t('tooManyAttemptsBody')}</AlertDescription>
                    </Alert>
                )}

                {result?.status === 'error' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        <AlertTitle>{t('errorTitle')}</AlertTitle>
                        <AlertDescription>{t('errorBody')}</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
