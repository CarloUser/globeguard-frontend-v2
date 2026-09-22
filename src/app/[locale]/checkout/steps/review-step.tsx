'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {AlertCircle, CreditCard, Edit, ExternalLink, Loader2, MapPin, Truck} from 'lucide-react';
import {Price} from '@/components/commerce/price';
import {isMolliePaymentMethod, paymentErrorKey} from '@/components/checkout/payment-method-codes';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {useCheckout} from '../checkout-provider';
import {placeOrder as placeOrderAction, type PlaceOrderResult} from '../actions';

interface ReviewStepProps {
    onEditStep: (step: 'shipping' | 'delivery' | 'payment') => void;
}

type PlaceOrderFailure = Extract<PlaceOrderResult, {success: false}>;

export default function ReviewStep({onEditStep}: ReviewStepProps) {
    const t = useTranslations('Checkout');
    const tPayment = useTranslations('Payment');
    const {order, paymentMethods, selectedPaymentMethodCode} = useCheckout();
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedPaymentMethod = paymentMethods.find(
        (method) => method.code === selectedPaymentMethodCode
    );
    const isOnlinePayment = isMolliePaymentMethod(selectedPaymentMethodCode);

    const describeFailure = (failure: PlaceOrderFailure): string => {
        const key = paymentErrorKey(failure.errorCode);
        if (key) {
            return tPayment(`errors.${key}`);
        }
        if (failure.source === 'mollie') {
            return tPayment('errors.generic');
        }
        return t('placeOrderFailed', {reason: failure.error});
    };

    const handlePlaceOrder = async () => {
        if (!selectedPaymentMethodCode) return;

        setLoading(true);
        setError(null);
        try {
            // Offline methods redirect to the confirmation page inside the server action
            // (the redirect is thrown by Next.js and must not be swallowed here).
            const result = await placeOrderAction(selectedPaymentMethodCode);
            if (!result) {
                return;
            }
            if (result.success) {
                // Mollie hosted checkout: external full-page navigation, not the next-intl router.
                setRedirecting(true);
                window.location.assign(result.redirectUrl);
                return;
            }
            setError(describeFailure(result));
            setLoading(false);
        } catch (err) {
            if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
                throw err;
            }
            console.error('Error placing order:', err);
            setError(t('placeOrderFailed', {reason: err instanceof Error ? err.message : t('unexpectedError')}));
            setLoading(false);
        }
    };

    const stepsIncomplete = !order.shippingAddress || !order.shippingLines?.length || !selectedPaymentMethodCode;

    return (
        <div className="space-y-6">
            <h3 className="font-semibold text-lg">{t('reviewYourOrder')}</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Shipping Address */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">{t('shippingAddress')}</h4>
                    </div>
                    {order.shippingAddress ? (
                        <div className="text-sm space-y-3">
                            <div>
                                <p className="font-medium">{order.shippingAddress.fullName}</p>
                                <p className="text-muted-foreground">
                                    {order.shippingAddress.streetLine1}
                                    {order.shippingAddress.streetLine2 && `, ${order.shippingAddress.streetLine2}`}
                                </p>
                                <p className="text-muted-foreground">
                                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                                    {order.shippingAddress.province && `, ${order.shippingAddress.province}`}
                                </p>
                                <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                                <p className="text-muted-foreground">{order.shippingAddress.phoneNumber}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onEditStep('shipping')}>
                                <Edit className="h-4 w-4 mr-1" />
                                {t('edit')}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noShippingAddress')}</p>
                    )}
                </div>

                {/* Delivery Method */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">{t('deliveryMethod')}</h4>
                    </div>
                    {order.shippingLines && order.shippingLines.length > 0 ? (
                        <div className="text-sm space-y-3">
                            <div>
                                <p className="font-medium">{order.shippingLines[0].shippingMethod.name}</p>
                                <p className="text-muted-foreground">
                                    {order.shippingLines[0].priceWithTax === 0
                                        ? t('free')
                                        : <Price value={order.shippingLines[0].priceWithTax} currencyCode={order.currencyCode} />}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onEditStep('delivery')}>
                                <Edit className="h-4 w-4 mr-1" />
                                {t('edit')}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noDeliveryMethod')}</p>
                    )}
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">{t('paymentMethod')}</h4>
                    </div>
                    {selectedPaymentMethod ? (
                        <div className="text-sm space-y-3">
                            <div>
                                <p className="font-medium">
                                    {isOnlinePayment ? tPayment('online.title') : selectedPaymentMethod.name}
                                </p>
                                {isOnlinePayment ? (
                                    <>
                                        <p className="text-muted-foreground mt-1">
                                            {selectedPaymentMethod.description || tPayment('online.description')}
                                        </p>
                                        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>{tPayment('online.redirectNote')}</span>
                                        </p>
                                    </>
                                ) : (
                                    selectedPaymentMethod.description && (
                                        <p className="text-muted-foreground mt-1">{selectedPaymentMethod.description}</p>
                                    )
                                )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onEditStep('payment')}>
                                <Edit className="h-4 w-4 mr-1" />
                                {t('edit')}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noPaymentMethod')}</p>
                    )}
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button
                onClick={handlePlaceOrder}
                disabled={loading || stepsIncomplete}
                size="lg"
                className="w-full"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {redirecting
                    ? tPayment('redirecting')
                    : isOnlinePayment
                        ? tPayment('continueToPayment')
                        : t('placeOrder')}
            </Button>

            {stepsIncomplete && (
                <p className="text-sm text-destructive text-center">
                    {t('completeAllSteps')}
                </p>
            )}
        </div>
    );
}
