'use client';

import {createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode} from 'react';
import {
    DEFAULT_DISPLAY_CURRENCY,
    DISPLAY_CURRENCY_COOKIE,
    DISPLAY_CURRENCY_COOKIE_MAX_AGE,
    isDisplayCurrency,
    parseDisplayCurrencyCookie,
    type DisplayCurrency,
} from '@/lib/display-currency';

/**
 * Holds the visitor's display currency (CHF | EUR). EUR is display-only (CHF x 1.1);
 * orders are always CHF. The value lives in the `gg-display-currency` cookie.
 *
 * Hydration safety: the store is read with useSyncExternalStore. The server snapshot is
 * `initialCurrency` (if a server wrapper read the cookie) or CHF; the client snapshot is
 * the cookie. React reconciles the two after hydration without a mismatch warning.
 */

interface DisplayCurrencyContextValue {
    displayCurrency: DisplayCurrency;
    setDisplayCurrency: (currency: DisplayCurrency) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue>({
    displayCurrency: DEFAULT_DISPLAY_CURRENCY,
    setDisplayCurrency: () => {},
});

// Minimal external store around document.cookie.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function readCookieCurrency(): DisplayCurrency {
    if (typeof document === 'undefined') {
        return DEFAULT_DISPLAY_CURRENCY;
    }
    return parseDisplayCurrencyCookie(document.cookie);
}

function writeCookieCurrency(currency: DisplayCurrency) {
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${DISPLAY_CURRENCY_COOKIE}=${currency}; path=/; max-age=${DISPLAY_CURRENCY_COOKIE_MAX_AGE}; samesite=lax${secure}`;
    listeners.forEach((listener) => listener());
}

interface DisplayCurrencyProviderProps {
    children: ReactNode;
    /**
     * Optional value read from the cookie on the server (e.g. via `cookies()` in a server
     * wrapper). Without it the server renders CHF and the client switches right after hydration.
     */
    initialCurrency?: DisplayCurrency;
}

export function DisplayCurrencyProvider({children, initialCurrency}: DisplayCurrencyProviderProps) {
    const serverCurrency = isDisplayCurrency(initialCurrency) ? initialCurrency : DEFAULT_DISPLAY_CURRENCY;
    const getServerSnapshot = useCallback(() => serverCurrency, [serverCurrency]);
    const displayCurrency = useSyncExternalStore(subscribe, readCookieCurrency, getServerSnapshot);

    const setDisplayCurrency = useCallback((currency: DisplayCurrency) => {
        if (isDisplayCurrency(currency)) {
            writeCookieCurrency(currency);
        }
    }, []);

    const value = useMemo(() => ({displayCurrency, setDisplayCurrency}), [displayCurrency, setDisplayCurrency]);

    return <DisplayCurrencyContext.Provider value={value}>{children}</DisplayCurrencyContext.Provider>;
}

export default DisplayCurrencyProvider;

/** Current display currency + setter. Falls back to CHF when no provider is mounted. */
export function useDisplayCurrency() {
    return useContext(DisplayCurrencyContext);
}
