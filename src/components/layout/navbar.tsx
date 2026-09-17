import {Suspense} from 'react';
import {NavigationLink} from '@/components/shared/navigation-link';
import {NavbarCart} from '@/components/layout/navbar/navbar-cart';
import {NavbarUser} from '@/components/layout/navbar/navbar-user';
import {LanguagePicker} from '@/components/layout/navbar/language-picker';
import {DisplayCurrencyToggle} from '@/components/layout/navbar/display-currency-toggle';
import {MainNav} from '@/components/layout/navbar/main-nav';
import {MobileNav} from '@/components/layout/navbar/mobile-nav';
import {MobileNavAuth} from '@/components/layout/navbar/mobile-nav-auth';
import {SearchInput} from '@/components/layout/search-input';
import {NavbarUserSkeleton} from '@/components/shared/skeletons/navbar-user-skeleton';
import {SearchInputSkeleton} from '@/components/shared/skeletons/search-input-skeleton';
import {GlobeguardBrand} from '@/components/layout/globeguard-brand';

export async function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Row 1: brand, search (lg+), utility cluster, mobile trigger (<lg) */}
                <div className="flex h-16 items-center justify-between gap-4 lg:h-18">
                    <NavigationLink href="/" className="shrink-0">
                        <GlobeguardBrand priority />
                    </NavigationLink>

                    <div className="hidden flex-1 justify-center lg:flex">
                        <Suspense fallback={<SearchInputSkeleton />}>
                            <SearchInput />
                        </Suspense>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Suspense>
                            <LanguagePicker />
                        </Suspense>
                        <Suspense>
                            <DisplayCurrencyToggle />
                        </Suspense>
                        <Suspense>
                            <NavbarCart />
                        </Suspense>
                        <div className="hidden sm:block">
                            <Suspense fallback={<NavbarUserSkeleton />}>
                                <NavbarUser />
                            </Suspense>
                        </div>

                        {/* Mobile menu toggle: visible below lg only */}
                        <div className="lg:hidden">
                            <MobileNav
                                authItem={
                                    <Suspense>
                                        <MobileNavAuth />
                                    </Suspense>
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2: desktop main navigation, visible from lg upwards */}
                <div className="hidden h-12 items-center border-t border-border/60 lg:flex">
                    <MainNav />
                </div>
            </div>
        </header>
    );
}
