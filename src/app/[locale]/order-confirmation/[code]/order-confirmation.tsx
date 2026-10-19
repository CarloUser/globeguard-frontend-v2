import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Check, ShoppingBag, ClipboardList, XCircle} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import Image from 'next/image';
import {Separator} from '@/components/ui/separator';
import {Price, VatNote} from '@/components/commerce/price';
import {SelectionBadge} from '@/components/checkout/selection-badge';
import {notFound} from 'next/navigation';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {query} from '@/lib/vendure/api';
import {graphql, type ResultOf} from '@/graphql';
import {PENDING_ORDER_STATES} from './order-states';
import {PaymentPendingStatus} from './payment-pending-status';

const GetOrderByCodeQuery = graphql(`
    query GetOrderByCode($code: String!) {
        orderByCode(code: $code) {
            id
            code
            state
            subTotal
            shippingWithTax
            totalWithTax
            currencyCode
            taxSummary {
                description
                taxRate
                taxBase
                taxTotal
            }
            discounts {
                description
                amount
            }
            lines {
                id
                productVariant {
                    id
                    name
                    sku
                    product {
                        id
                        name
                        slug
                        featuredAsset {
                            id
                            preview
                        }
                    }
                }
                quantity
                linePrice
                customFields {
                    selectedBrandGroupId
                    selectedYear
                    selectedBrandGroupIds
                }
            }
            shippingAddress {
                fullName
                streetLine1
                streetLine2
                city
                province
                postalCode
                country
            }
        }
    }
`);

type OrderByCode = ResultOf<typeof GetOrderByCodeQuery>['orderByCode'];

type ConfirmationVariant = 'success' | 'pending' | 'cancelled';

/**
 * Maps the Vendure order state to what the confirmation page should say.
 * - PaymentSettled (Mollie, immediate capture) / PaymentAuthorized (invoice: offline
 *   Authorized payment settled manually) and every later fulfilment state -> success
 * - ArrangingPayment / AddingItems -> payment still outstanding: the webhook has not
 *   settled the Mollie payment yet (or the customer abandoned it) -> poll, see
 *   PaymentPendingStatus
 * - Cancelled -> failure
 */
function getConfirmationVariant(state: string): ConfirmationVariant {
    if (state === 'Cancelled') {
        return 'cancelled';
    }
    if (PENDING_ORDER_STATES.includes(state)) {
        return 'pending';
    }
    return 'success';
}

interface OrderConfirmationProps {
    paramsPromise: Promise<{ locale: string; code: string }>;
}

export async function OrderConfirmation({paramsPromise}: OrderConfirmationProps) {
    const {code} = await paramsPromise;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'OrderConfirmation'});

    // orderByCode is owner-scoped (accounts are mandatory): the auth cookie must be sent. A foreign
    // or unknown code is answered with a FORBIDDEN GraphQL error, which `query` throws -> 404.
    let order: OrderByCode = null;
    try {
        const {data} = await query(GetOrderByCodeQuery, {code}, {useAuthToken: true, languageCode: locale});
        order = data.orderByCode;
    } catch (error) {
        console.warn(`Order confirmation: could not load order ${code}`, error);
    }

    if (!order) {
        notFound();
    }

    const variant = getConfirmationVariant(order.state);
    // Same rows as the cart/checkout summaries: NET subtotal, VAT, gross shipping and total.
    const vatTotal = order.taxSummary.reduce((sum, entry) => sum + entry.taxTotal, 0);

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    {variant === 'success' && (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="rounded-full bg-primary p-5 shadow-lg shadow-primary/25">
                                    <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">{t('orderConfirmed')}</h1>
                            <p className="text-muted-foreground">
                                {t('thankYou')}{' '}
                                <span className="font-semibold text-foreground">{order.code}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t('emailConfirmation')}
                            </p>
                        </>
                    )}

                    {variant === 'pending' && (
                        // Remounts (and restarts the poll) whenever the server-rendered state changes.
                        <PaymentPendingStatus key={order.state} code={order.code} />
                    )}

                    {variant === 'cancelled' && (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="rounded-full bg-destructive/10 p-5">
                                    <XCircle className="h-10 w-10 text-destructive" strokeWidth={2.5} />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">{t('orderCancelled')}</h1>
                            <p className="text-muted-foreground">
                                {t('orderCancelledMessage')}{' '}
                                <span className="font-semibold text-foreground">{order.code}</span>
                            </p>
                        </>
                    )}
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>{t('orderSummary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {order.lines.map((line) => (
                            <div key={line.id} className="flex gap-4 items-center">
                                {line.productVariant.product.featuredAsset && (
                                    <div className="flex-shrink-0">
                                        <Image
                                            src={line.productVariant.product.featuredAsset.preview}
                                            alt={line.productVariant.name}
                                            width={80}
                                            height={80}
                                            className="rounded-lg object-cover h-20 w-20 object-center"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{line.productVariant.product.name}</p>
                                    {line.productVariant.name !== line.productVariant.product.name && (
                                        <p className="text-sm text-muted-foreground">
                                            {line.productVariant.name}
                                        </p>
                                    )}
                                    <SelectionBadge selection={line.customFields} locale={locale} className="mt-1" />
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('qty', {quantity: line.quantity})}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">
                                        <Price value={line.linePrice} currencyCode={order.currencyCode}/>
                                    </p>
                                    <VatNote className="text-xs text-muted-foreground" />
                                </div>
                            </div>
                        ))}

                        <Separator/>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('subtotalNet')}</span>
                                <span><Price value={order.subTotal} currencyCode={order.currencyCode}/></span>
                            </div>
                            {order.discounts.map((discount, index) => (
                                <div key={index} className="flex justify-between text-green-700">
                                    <span>{discount.description}</span>
                                    <span><Price value={discount.amount} currencyCode={order.currencyCode}/></span>
                                </div>
                            ))}
                            {order.taxSummary.length > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('vat')}</span>
                                    <span><Price value={vatTotal} currencyCode={order.currencyCode}/></span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shipping')}</span>
                                <span><Price value={order.shippingWithTax} currencyCode={order.currencyCode}/></span>
                            </div>
                        </div>

                        <Separator/>

                        <div className="flex justify-between items-baseline font-bold text-lg">
                            <span>{t('total')}</span>
                            <span className="text-xl">
                                <Price value={order.totalWithTax} currencyCode={order.currencyCode}/>
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {order.shippingAddress && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>{t('shippingAddress')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {order.shippingAddress.streetLine1}
                                {order.shippingAddress.streetLine2 && `, ${order.shippingAddress.streetLine2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                                {order.shippingAddress.province && `, ${order.shippingAddress.province}`}
                            </p>
                            <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
                        </CardContent>
                    </Card>
                )}

                {/* While pending, PaymentPendingStatus owns the actions (refresh / retry / orders). */}
                {variant !== 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button nativeButton={false} render={<Link href="/" />} className="flex-1" size="lg">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            {t('continueShopping')}
                        </Button>
                        <Button nativeButton={false} render={<Link href="/account/orders" />} variant="outline" className="flex-1" size="lg">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            {t('viewOrders')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
