'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Truck, CreditCard, Edit, AlertCircle } from 'lucide-react';
import { useCheckout } from '../checkout-provider';
import { placeOrder as placeOrderAction } from '../actions';
import { Price } from '@/components/commerce/price';
import {useTranslations} from 'next-intl';

interface ReviewStepProps {
  onEditStep: (step: 'shipping' | 'delivery' | 'payment') => void;
}

export default function ReviewStep({ onEditStep }: ReviewStepProps) {
  const t = useTranslations('Checkout');
  const { order, paymentMethods, selectedPaymentMethodCode } = useCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.code === selectedPaymentMethodCode
  );

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethodCode) return;

    setLoading(true);
    setError(null);
    try {
      // On success the server action redirects to the order confirmation page
      // (the redirect is thrown by Next.js and must not be swallowed here).
      const result = await placeOrderAction(selectedPaymentMethodCode);
      if (result && !result.success) {
        setError(
          result.error === 'PAYMENT_METHOD_NOT_AVAILABLE'
            ? t('paymentMethodUnavailable')
            : t('placeOrderFailed', {reason: result.error})
        );
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        throw err;
      }
      console.error('Error placing order:', err);
      setError(t('placeOrderFailed', {reason: err instanceof Error ? err.message : t('unexpectedError')}));
      setLoading(false);
    }
  };

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditStep('shipping')}
              >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditStep('delivery')}
              >
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
                <p className="font-medium">{selectedPaymentMethod.name}</p>
                {selectedPaymentMethod.description && (
                  <p className="text-muted-foreground mt-1">
                    {selectedPaymentMethod.description}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditStep('payment')}
              >
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
        disabled={loading || !order.shippingAddress || !order.shippingLines?.length || !selectedPaymentMethodCode}
        size="lg"
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('placeOrder')}
      </Button>

      {(!order.shippingAddress || !order.shippingLines?.length || !selectedPaymentMethodCode) && (
        <p className="text-sm text-destructive text-center">
          {t('completeAllSteps')}
        </p>
      )}
    </div>
  );
}
