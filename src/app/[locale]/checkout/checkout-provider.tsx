'use client';

import {createContext, useContext, ReactNode, useState} from 'react';
import type {MolliePaymentMethodSummary} from '@/components/checkout/payment-method-codes';
import {CheckoutOrder} from './types';

interface CustomerAddress {
    id: string;
    fullName?: string | null;
    company?: string | null;
    streetLine1: string;
    streetLine2?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    country: {id: string; code: string; name: string};
    phoneNumber?: string | null;
    defaultShippingAddress?: boolean | null;
    defaultBillingAddress?: boolean | null;
}

interface Country {
    id: string;
    code: string;
    name: string;
}

interface ShippingMethod {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    /** NET price in minor units. */
    price: number;
    priceWithTax: number;
}

interface PaymentMethod {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isEligible: boolean;
    eligibilityMessage?: string | null;
}

interface CheckoutContextType {
    order: CheckoutOrder;
    addresses: CustomerAddress[];
    countries: Country[];
    shippingMethods: ShippingMethod[];
    /** Eligible Vendure payment methods, already sorted (online payment first, then invoice). */
    paymentMethods: PaymentMethod[];
    /** Mollie methods (TWINT, card, ...) shown as logos on the "Online bezahlen" tile; may be empty. */
    mollieMethods: MolliePaymentMethodSummary[];
    selectedPaymentMethodCode: string | null;
    setSelectedPaymentMethodCode: (code: string | null) => void;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

interface CheckoutProviderProps {
    children: ReactNode;
    order: CheckoutOrder;
    addresses: CustomerAddress[];
    countries: Country[];
    shippingMethods: ShippingMethod[];
    paymentMethods: PaymentMethod[];
    mollieMethods?: MolliePaymentMethodSummary[];
}

export function CheckoutProvider({
    children,
    order,
    addresses,
    countries,
    shippingMethods,
    paymentMethods,
    mollieMethods = [],
}: CheckoutProviderProps) {
    const [selectedPaymentMethodCode, setSelectedPaymentMethodCode] = useState<string | null>(
        paymentMethods.length === 1 ? paymentMethods[0].code : null
    );

    return (
        <CheckoutContext.Provider
            value={{
                order,
                addresses,
                countries,
                shippingMethods,
                paymentMethods,
                mollieMethods,
                selectedPaymentMethodCode,
                setSelectedPaymentMethodCode,
            }}
        >
            {children}
        </CheckoutContext.Provider>
    );
}

export function useCheckout() {
    const context = useContext(CheckoutContext);
    if (!context) {
        throw new Error('useCheckout must be used within CheckoutProvider');
    }
    return context;
}
