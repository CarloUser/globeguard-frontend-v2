'use client';

import {useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {
    BookOpen,
    Cable,
    HelpCircle,
    LifeBuoy,
    MapPin,
    Menu,
    Package,
    RefreshCw,
    Search,
    ShoppingCart,
    User,
    Wrench,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from '@/components/ui/sheet';
import {useTranslations} from 'next-intl';
import {GlobeguardBrand} from '@/components/layout/globeguard-brand';
import {DisplayCurrencyToggle} from '@/components/layout/navbar/display-currency-toggle';
import {ACCOUNT_NAV_ITEMS, MAIN_NAV_ITEMS, MOBILE_NAV_ITEM_CLASS} from '@/components/layout/navbar/site-navigation';

// TODO(F3): the Vendure top-collections list was dropped here because `GetTopCollectionsQuery`
// returns every non-root collection flat (28 entries). Re-add only if limited to root-level collections.

const navIcons: Record<string, typeof Package> = {
    warumGlobeguard: HelpCircle,
    basic: Package,
    pro: Package,
    elite: Package,
    zubehoer: Cable,
    services: Wrench,
    updates: RefreshCw,
    support: LifeBuoy,
    profile: User,
    orders: Package,
    addresses: MapPin,
};

const itemClassName = MOBILE_NAV_ITEM_CLASS;

interface MobileNavProps {
    /** Sign-in / sign-out entry rendered by the server (see MobileNavAuth). */
    authItem?: React.ReactNode;
}

export function MobileNav({authItem}: MobileNavProps) {
    const t = useTranslations('Navigation');
    const tCommon = useTranslations('Common');
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) return;
        router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        setOpen(false);
    };

    const handleLinkClick = () => {
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
                <Menu className="size-5" />
                <span className="sr-only">{t('openMenu')}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm" closeLabel={t('closeMenu')}>
                <SheetHeader>
                    <SheetTitle>
                        <GlobeguardBrand compact />
                        {/* Dialog name for screen readers; the logo alone only says "GlobeGuard" */}
                        <span className="sr-only">{t('menu')}</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4 pb-6">
                    <form onSubmit={handleSearch} className="relative" role="search">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            name="q"
                            placeholder={t('searchProducts')}
                            className="w-full pl-9"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </form>

                    <div>
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('menu')}
                        </p>
                        <nav className="flex flex-col gap-0.5" aria-label={t('mainNavigation')}>
                            {MAIN_NAV_ITEMS.map((item) => {
                                const Icon = navIcons[item.key] ?? BookOpen;
                                return (
                                    <SheetClose
                                        key={item.href}
                                        render={<Link href={item.href} className={itemClassName} />}
                                        nativeButton={false}
                                        onClick={handleLinkClick}
                                    >
                                        <Icon className="size-5" />
                                        {t(item.key)}
                                    </SheetClose>
                                );
                            })}
                        </nav>
                    </div>

                    <div>
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('account')}
                        </p>
                        <nav className="flex flex-col gap-0.5">
                            {ACCOUNT_NAV_ITEMS.map((item) => {
                                const Icon = navIcons[item.key] ?? User;
                                return (
                                    <SheetClose
                                        key={item.href}
                                        render={<Link href={item.href} className={itemClassName} />}
                                        nativeButton={false}
                                        onClick={handleLinkClick}
                                    >
                                        <Icon className="size-5" />
                                        {t(item.key)}
                                    </SheetClose>
                                );
                            })}
                            <SheetClose
                                render={<Link href="/cart" className={itemClassName} />}
                                nativeButton={false}
                                onClick={handleLinkClick}
                            >
                                <ShoppingCart className="size-5" />
                                {t('shoppingCart')}
                            </SheetClose>
                            {authItem}
                        </nav>
                    </div>

                    {/* The navbar hides its CHF | EUR toggle below 360px; offer it here instead */}
                    <div className="min-[360px]:hidden">
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {tCommon('displayCurrency')}
                        </p>
                        <DisplayCurrencyToggle className="px-3" />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
