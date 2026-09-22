import type {Metadata} from 'next';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {query} from '@/lib/vendure/api';
import {
    GetActiveOrderForCheckoutQuery,
    GetCustomerAddressesQuery,
    GetEligiblePaymentMethodsQuery,
    GetEligibleShippingMethodsQuery,
} from '@/lib/vendure/queries';
import {getMolliePaymentMethodSummaries} from '@/lib/vendure/mollie';
import {isMolliePaymentMethod, paymentMethodSortIndex} from '@/components/checkout/payment-method-codes';
import {redirect} from '@/i18n/navigation';
import CheckoutFlow from './checkout-flow';
import {CheckoutProvider} from './checkout-provider';
import {buildAlternates, noIndexRobots} from '@/lib/metadata';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {getAvailableCountriesCached} from '@/lib/vendure/cached';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Checkout'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
        alternates: buildAlternates(locale, '/checkout'),
    };
}

export default async function CheckoutPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Checkout'});

    // Accounts are mandatory at checkout (guest checkout is disabled in the backend).
    // No loading.tsx for this route: a Suspense boundary above the page would stream this
    // redirect as a client-side NEXT_REDIRECT (HTTP 200 + meta refresh) instead of a real 307.
    const customer = await getActiveCustomer();
    if (!customer) {
        return redirect({href: `/sign-in?redirectTo=${encodeURIComponent('/checkout')}`, locale});
    }

    // Orders are always in the channel currency (CHF); no currencyCode override.
    // Product, country, shipping and payment names are translatable, so every query has to
    // carry the request languageCode - without it the English checkout shows German names.
    const [orderRes, addressesRes, countries, shippingMethodsRes, paymentMethodsRes] =
        await Promise.all([
            query(GetActiveOrderForCheckoutQuery, {}, {useAuthToken: true, languageCode: locale}),
            query(GetCustomerAddressesQuery, {}, {useAuthToken: true, languageCode: locale}),
            getAvailableCountriesCached(locale),
            query(GetEligibleShippingMethodsQuery, {}, {useAuthToken: true, languageCode: locale}),
            query(GetEligiblePaymentMethodsQuery, {}, {useAuthToken: true, languageCode: locale}),
        ]);

    const activeOrder = orderRes.data.activeOrder;

    if (!activeOrder || activeOrder.lines.length === 0) {
        return redirect({href: '/cart', locale});
    }

    if (activeOrder.state !== 'AddingItems' && activeOrder.state !== 'ArrangingPayment') {
        return redirect({href: `/order-confirmation/${activeOrder.code}`, locale});
    }

    const addresses = addressesRes.data.activeCustomer?.addresses || [];
    const shippingMethods = shippingMethodsRes.data.eligibleShippingMethods || [];
    // Eligible methods only, online payment ("Online bezahlen") first, then invoice.
    const paymentMethods = (paymentMethodsRes.data.eligiblePaymentMethods || [])
        .filter((m) => m.isEligible)
        .sort((a, b) => paymentMethodSortIndex(a.code) - paymentMethodSortIndex(b.code));
    // Logos for the online tile; best effort (empty without a Mollie key or when Mollie is unreachable).
    const mollieMethods = paymentMethods.some((m) => isMolliePaymentMethod(m.code))
        ? await getMolliePaymentMethodSummaries()
        : [];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>
            <CheckoutProvider
                order={activeOrder}
                addresses={addresses}
                countries={countries}
                shippingMethods={shippingMethods}
                paymentMethods={paymentMethods}
                mollieMethods={mollieMethods}
            >
                <CheckoutFlow/>
            </CheckoutProvider>
        </div>
    );
}
