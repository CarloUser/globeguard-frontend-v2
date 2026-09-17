import type {Metadata} from 'next';
import {Suspense} from 'react';
import {noIndexRobots} from '@/lib/metadata';
import {AccountNavLinks} from '@/components/account/account-nav-links';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {getRouteLocale} from '@/i18n/server';
import {redirect} from '@/i18n/navigation';

export const metadata: Metadata = {
    robots: noIndexRobots(),
};

const navItems = [
    {href: '/account/orders', labelKey: 'orders', icon: 'Package'},
    {href: '/account/addresses', labelKey: 'addresses', icon: 'MapPin'},
    {href: '/account/profile', labelKey: 'profile', icon: 'User'},
];

/**
 * Layouts do not receive the current pathname, so the post-login redirect
 * target defaults to the account landing page (orders). Individual account
 * pages that need a more precise target can pass their own redirectTo.
 */
const ACCOUNT_LANDING_PATH = '/account/orders';

export default async function AccountLayout({children}: LayoutProps<'/[locale]/account'>) {
    const customer = await getActiveCustomer();
    if (!customer) {
        const locale = await getRouteLocale();
        return redirect({
            href: `/sign-in?redirectTo=${encodeURIComponent(ACCOUNT_LANDING_PATH)}`,
            locale,
        });
    }

    return (
        <div className="container mx-auto px-4 py-30">
            {/* Mobile: horizontal tab bar */}
            <div className="md:hidden mb-6">
                <Suspense>
                    <AccountNavLinks items={navItems} layout="horizontal" />
                </Suspense>
            </div>

            <div className="flex gap-8">
                {/* Desktop: sidebar */}
                <aside className="hidden md:block w-64 shrink-0">
                    <Suspense>
                        <AccountNavLinks items={navItems} layout="vertical" />
                    </Suspense>
                </aside>
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
