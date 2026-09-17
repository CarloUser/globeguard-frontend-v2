import {LogIn, LogOut} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {SheetClose} from '@/components/ui/sheet';
import {LoginButton} from '@/components/layout/navbar/login-button';
import {MOBILE_NAV_ITEM_CLASS} from '@/components/layout/navbar/site-navigation';
import {getActiveCustomer} from '@/lib/vendure/actions';

/**
 * Sign-in / sign-out entry of the mobile sheet. The header user menu is hidden below
 * `sm`, so phones need a direct path to /sign-in. Server component so it can read the
 * session; a failing shop API degrades to the signed-out state.
 */
export async function MobileNavAuth() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Navigation'});

    let isLoggedIn = false;
    try {
        isLoggedIn = Boolean(await getActiveCustomer());
    } catch (error) {
        console.warn('MobileNavAuth: could not load the active customer, treating as logged out', error);
    }

    if (isLoggedIn) {
        return (
            <SheetClose render={<LoginButton isLoggedIn className={MOBILE_NAV_ITEM_CLASS} />}>
                <LogOut className="size-5" />
            </SheetClose>
        );
    }

    return (
        <SheetClose render={<Link href="/sign-in" className={MOBILE_NAV_ITEM_CLASS} />} nativeButton={false}>
            <LogIn className="size-5" />
            {t('signIn')}
        </SheetClose>
    );
}
