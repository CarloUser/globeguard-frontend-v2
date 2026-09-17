'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent} from '@/components/ui/card';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {PackageSearch} from 'lucide-react';
import {useTranslations} from 'next-intl';

interface TrackOrderFormData {
    orderCode: string;
    emailAddress: string;
}

export function TrackOrderForm() {
    const t = useTranslations('TrackOrder');
    const [submitted, setSubmitted] = useState<TrackOrderFormData | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<TrackOrderFormData>({
        defaultValues: {orderCode: '', emailAddress: ''},
    });

    const onSubmit = (data: TrackOrderFormData) => {
        // TODO(backend): call a server action that queries an order-lookup
        // resolver (order code + e-mail). No such shop-API query exists yet,
        // so this only shows a placeholder result.
        setSubmitted(data);
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
                                    disabled={isSubmitting}
                                    {...register('orderCode', {required: t('orderCodeRequired')})}
                                />
                                <FieldError>{errors.orderCode?.message}</FieldError>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="emailAddress">{t('emailAddress')}</FieldLabel>
                                <Input
                                    id="emailAddress"
                                    type="email"
                                    autoComplete="email"
                                    disabled={isSubmitting}
                                    {...register('emailAddress', {
                                        required: t('emailRequired'),
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: t('emailInvalid'),
                                        },
                                    })}
                                />
                                <FieldError>{errors.emailAddress?.message}</FieldError>
                            </Field>

                            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                                <PackageSearch className="mr-2 h-4 w-4" />
                                {t('submit')}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            {submitted && (
                <Card>
                    <CardContent className="pt-6 space-y-2">
                        <p className="font-medium">
                            {t('resultTitle', {orderCode: submitted.orderCode})}
                        </p>
                        <p className="text-sm text-muted-foreground">{t('resultPlaceholder')}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
