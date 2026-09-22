'use client';

import {useLocale, useTranslations} from 'next-intl';
import {OrderStatusBadge} from '@/components/commerce/order-status-badge';
import {Price} from '@/components/commerce/price';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {toIntlLocale} from '@/i18n/locale-utils';
import {formatSelectionBadge} from '@/lib/globeguard/picker';
import type {TrackedOrder} from '@/lib/vendure/order-tracking';

interface TrackedOrderViewProps {
    order: TrackedOrder;
}

const FULFILLMENT_STATES = ['Created', 'Pending', 'Shipped', 'Delivered', 'Cancelled'] as const;
const PAYMENT_STATES = ['Created', 'Authorized', 'Settled', 'Declined', 'Error', 'Cancelled'] as const;
const PAYMENT_METHODS = ['invoice', 'mollie'] as const;

type FulfillmentState = (typeof FULFILLMENT_STATES)[number];
type PaymentState = (typeof PAYMENT_STATES)[number];
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
    return (list as readonly string[]).includes(value);
}

/** Numeric date in the storefront locale (de-CH: 17.09.2026). */
function formatTrackedDate(value: string, locale: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat(toIntlLocale(locale), {day: '2-digit', month: '2-digit', year: 'numeric'}).format(parsed);
}

/**
 * Customer-safe order view for /track-order: status, lines (with the configurator selection
 * badge), shipping method, shipments with tracking codes, payments and NET / gross totals.
 * The backend deliberately returns no addresses or customer data.
 */
export function TrackedOrderView({order}: TrackedOrderViewProps) {
    const locale = useLocale();
    const t = useTranslations('Tracking');

    // TrackedOrder carries no tax summary; subTotal is NET and totalWithTax = subTotalWithTax + shippingWithTax.
    const vatTotal = Math.max(0, order.totalWithTax - order.shippingWithTax - order.subTotal);

    const fulfillmentLabel = (state: string) =>
        isOneOf<FulfillmentState>(FULFILLMENT_STATES, state) ? t(`fulfillmentState.${state}`) : state;
    const paymentStateLabel = (state: string) =>
        isOneOf<PaymentState>(PAYMENT_STATES, state) ? t(`paymentState.${state}`) : state;
    const paymentMethodLabel = (method: string) =>
        isOneOf<PaymentMethod>(PAYMENT_METHODS, method) ? t(`paymentMethod.${method}`) : method;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="font-mono text-lg">{t('result.orderTitle', {code: order.code})}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('result.placedOn', {date: formatTrackedDate(order.orderPlacedAt, locale)})}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{t('result.status')}</span>
                            <OrderStatusBadge state={order.state} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <section aria-labelledby="tracked-items">
                        <h3 id="tracked-items" className="mb-3 text-sm font-semibold text-foreground">
                            {t('result.items')}
                        </h3>
                        <ul className="divide-y divide-slate-200">
                            {order.lines.map((line, index) => {
                                const selection = formatSelectionBadge(line.customFields, locale);
                                return (
                                    <li key={`${line.productVariant.sku}-${index}`} className="flex items-start justify-between gap-4 py-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">{line.productVariant.name}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{t('result.sku', {sku: line.productVariant.sku})}</p>
                                            {selection && (
                                                <Badge variant="secondary" className="mt-1 text-xs font-normal">
                                                    {selection}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="shrink-0 text-sm text-muted-foreground">{t('result.quantity', {quantity: line.quantity})}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {order.shippingLines.length > 0 && (
                        <section aria-labelledby="tracked-shipping">
                            <h3 id="tracked-shipping" className="mb-2 text-sm font-semibold text-foreground">
                                {t('result.shippingMethod')}
                            </h3>
                            <ul className="text-sm text-slate-700">
                                {order.shippingLines.map((line, index) => (
                                    <li key={index}>{line.shippingMethod.name}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section aria-labelledby="tracked-fulfillments">
                        <h3 id="tracked-fulfillments" className="mb-2 text-sm font-semibold text-foreground">
                            {t('result.fulfillments')}
                        </h3>
                        {order.fulfillments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('result.noFulfillments')}</p>
                        ) : (
                            <ul className="space-y-2">
                                {order.fulfillments.map((fulfillment, index) => (
                                    <li key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-medium text-foreground">{fulfillment.method}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {fulfillmentLabel(fulfillment.state)}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-muted-foreground">
                                            {t('result.fulfillmentCreated', {date: formatTrackedDate(fulfillment.createdAt, locale)})}
                                        </p>
                                        {fulfillment.trackingCode && (
                                            <p className="mt-1">
                                                <span className="text-muted-foreground">{t('result.trackingCode')}: </span>
                                                <span className="font-mono">{fulfillment.trackingCode}</span>
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {order.payments.length > 0 && (
                        <section aria-labelledby="tracked-payments">
                            <h3 id="tracked-payments" className="mb-2 text-sm font-semibold text-foreground">
                                {t('result.payments')}
                            </h3>
                            <ul className="space-y-2">
                                {order.payments.map((payment, index) => (
                                    <li key={index} className="space-y-1 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">{t('result.paymentMethod')}</span>
                                            <span className="font-medium">{paymentMethodLabel(payment.method)}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">{t('result.amount')}</span>
                                            <Price value={payment.amount} currencyCode={order.currencyCode} />
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">{t('result.paymentState')}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {paymentStateLabel(payment.state)}
                                            </Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section aria-labelledby="tracked-summary">
                        <h3 id="tracked-summary" className="mb-2 text-sm font-semibold text-foreground">
                            {t('result.summary')}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t('result.subtotalNet')}</span>
                                <Price value={order.subTotal} currencyCode={order.currencyCode} />
                            </div>
                            {vatTotal > 0 && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">{t('result.vat')}</span>
                                    <Price value={vatTotal} currencyCode={order.currencyCode} />
                                </div>
                            )}
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t('result.shipping')}</span>
                                <Price value={order.shippingWithTax} currencyCode={order.currencyCode} />
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between gap-4 text-base font-bold">
                                <span>
                                    {t('result.total')}{' '}
                                    <span className="text-xs font-normal text-muted-foreground">{t('result.totalNote')}</span>
                                </span>
                                <Price value={order.totalWithTax} currencyCode={order.currencyCode} />
                            </div>
                        </div>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
