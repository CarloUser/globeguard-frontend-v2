'use client';

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {useEffect} from 'react';

/**
 * Keeps the picker configuration (`?year=YYYY&extraBrands=...`) across a locale switch.
 *
 * The navbar LanguagePicker calls next-intl's `router.replace(pathname, {locale})` with
 * the bare pathname, so the query string is dropped when the customer switches between
 * /products/<slug>?year=2020 and /en/products/<slug>. This hook remembers the last
 * picker params of the current product (sessionStorage, per tab) and re-appends them
 * when the same product mounts again under a different pathname (= other locale prefix)
 * within a short window. A later, deliberate visit to the plain product page (from a
 * listing, minutes later, same locale) is left untouched.
 */

const STORAGE_KEY = 'gg-picker-params';
const PICKER_PARAM_NAMES = ['year', 'extraBrands'] as const;
/** Locale switches remount within well under a second; anything older is a real navigation. */
const REAPPLY_WINDOW_MS = 3000;

interface StoredPickerParams {
    slug: string;
    pathname: string;
    params: Partial<Record<(typeof PICKER_PARAM_NAMES)[number], string>>;
    at: number;
}

function readStored(): StoredPickerParams | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as StoredPickerParams) : null;
    } catch {
        return null;
    }
}

function writeStored(entry: StoredPickerParams | null): void {
    try {
        if (entry) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
        } else {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Storage unavailable (private mode, quota): the params are simply not preserved.
    }
}

export function usePreservePickerParams(slug: string): void {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const present: StoredPickerParams['params'] = {};

        for (const name of PICKER_PARAM_NAMES) {
            const value = searchParams.get(name);
            if (value) {
                present[name] = value;
            }
        }

        if (Object.keys(present).length > 0) {
            const entry: StoredPickerParams = {slug, pathname, params: present, at: Date.now()};
            writeStored(entry);

            // Refresh the timestamp when the page goes away so the re-apply window
            // starts at the locale switch, not at the last render.
            return () => {
                writeStored({...entry, at: Date.now()});
            };
        }

        const stored = readStored();

        if (!stored || stored.slug !== slug || stored.pathname === pathname) {
            return undefined;
        }

        if (Date.now() - stored.at > REAPPLY_WINDOW_MS) {
            writeStored(null);
            return undefined;
        }

        const next = new URLSearchParams(searchParams.toString());

        for (const name of PICKER_PARAM_NAMES) {
            const value = stored.params[name];
            if (value) {
                next.set(name, value);
            }
        }

        writeStored(null);
        router.replace(`${pathname}?${next.toString()}`, {scroll: false});
        return undefined;
    }, [slug, pathname, searchParams, router]);
}
