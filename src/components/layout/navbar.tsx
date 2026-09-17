import {NavigationLink} from '@/components/shared/navigation-link';
import {NavbarCart} from '@/components/layout/navbar/navbar-cart';
import {NavbarUser} from '@/components/layout/navbar/navbar-user';
import {LanguagePicker} from '@/components/layout/navbar/language-picker';
import {ThemeSwitcher} from '@/components/layout/navbar/theme-switcher';
import {MobileNavWrapper} from '@/components/layout/navbar/mobile-nav-wrapper';
import {Suspense} from 'react';
import {NavbarUserSkeleton} from '@/components/shared/skeletons/navbar-user-skeleton';
import {GlobeguardBrand} from '@/components/layout/globeguard-brand';
import {ChevronDown} from 'lucide-react';
import {getRouteLocale} from '@/i18n/server';

export async function Navbar() {
    const locale = await getRouteLocale();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0E1E4B]/95">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex h-20 items-center justify-between gap-4">
                    <div className="flex items-center gap-8 lg:gap-12">
                        <NavigationLink href="/" className="shrink-0">
                            <GlobeguardBrand priority />
                        </NavigationLink>
                        
                        <nav className="hidden items-center gap-8 xl:flex">
                            {/* Products Dropdown */}
                            <div className="relative group py-5">
                                <button className="flex items-center gap-1 text-sm font-semibold text-[#0E1E4B]/90 transition-colors hover:text-primary dark:text-[#D9DEE8] dark:hover:text-accent">
                                    <span>Products</span>
                                    <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-450 dark:text-slate-400" />
                                </button>
                                <div className="absolute left-0 top-full z-50 hidden w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg group-hover:block dark:border-slate-800 dark:bg-[#0E1E4B] animate-in fade-in-50 slide-in-from-top-2 duration-150">
                                    <NavigationLink href="/search" className="block rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="text-xs font-bold text-[#0E1E4B] dark:text-white">Diagnostic Devices</div>
                                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Explore premium OBD-II scanners & hardware.</div>
                                    </NavigationLink>
                                    <NavigationLink href="#software-licenses" className="block rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="text-xs font-bold text-[#0E1E4B] dark:text-white">Software Licenses</div>
                                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Unlock dealer-level vehicle codings & functions.</div>
                                    </NavigationLink>
                                </div>
                            </div>

                            {/* Solutions Dropdown */}
                            <div className="relative group py-5">
                                <button className="flex items-center gap-1 text-sm font-semibold text-[#0E1E4B]/90 transition-colors hover:text-primary dark:text-[#D9DEE8] dark:hover:text-accent">
                                    <span>Solutions</span>
                                    <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-450 dark:text-slate-400" />
                                </button>
                                <div className="absolute left-0 top-full z-50 hidden w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg group-hover:block dark:border-slate-800 dark:bg-[#0E1E4B] animate-in fade-in-50 slide-in-from-top-2 duration-150">
                                    <NavigationLink href="#remote-diagnostics" className="block rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="text-xs font-bold text-[#0E1E4B] dark:text-white">Remote Diagnostics</div>
                                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">On-demand remote mechanic connections.</div>
                                    </NavigationLink>
                                    <NavigationLink href="#elite" className="block rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="text-xs font-bold text-[#0E1E4B] dark:text-white">Elite (B2B Workshop)</div>
                                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Multi-seat dashboard & commercial SLAs.</div>
                                    </NavigationLink>
                                </div>
                            </div>

                            {/* Supported Vehicles Link */}
                            <NavigationLink href="#supported-vehicles" className="text-sm font-semibold text-[#0E1E4B]/90 transition-colors hover:text-primary dark:text-[#D9DEE8] dark:hover:text-accent">
                                Supported Vehicles
                            </NavigationLink>

                            {/* Company Dropdown */}
                            <div className="relative group py-5">
                                <button className="flex items-center gap-1 text-sm font-semibold text-[#0E1E4B]/90 transition-colors hover:text-primary dark:text-[#D9DEE8] dark:hover:text-accent">
                                    <span>Company</span>
                                    <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-450 dark:text-slate-400" />
                                </button>
                                <div className="absolute left-0 top-full z-50 hidden w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg group-hover:block dark:border-slate-800 dark:bg-[#0E1E4B] animate-in fade-in-50 slide-in-from-top-2 duration-150">
                                    <NavigationLink href="/support" className="block rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="text-xs font-bold text-[#0E1E4B] dark:text-white">About Us</div>
                                    </NavigationLink>
                                    <NavigationLink href="/contact" className="block rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="text-xs font-bold text-[#0E1E4B] dark:text-white">Contact & Support</div>
                                    </NavigationLink>
                                </div>
                            </div>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden items-center gap-3 md:flex">
                            <NavigationLink 
                                href="/search" 
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-[1px]"
                            >
                                Shop Devices
                            </NavigationLink>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Suspense>
                                <LanguagePicker />
                            </Suspense>
                            <Suspense>
                                <ThemeSwitcher />
                            </Suspense>
                            <Suspense>
                                <NavbarCart />
                            </Suspense>
                            <Suspense fallback={<NavbarUserSkeleton />}>
                                <NavbarUser />
                            </Suspense>
                            
                            {/* Mobile Menu Toggle button */}
                            <div className="xl:hidden">
                                <Suspense>
                                    <MobileNavWrapper locale={locale} />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
