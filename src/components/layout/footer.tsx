import {NavigationLink} from '@/components/shared/navigation-link';
import {getGlobeguardContent} from '@/content/globeguard';
import {GlobeguardBrand} from '@/components/layout/globeguard-brand';

const COPYRIGHT_YEAR = 2026;

export async function Footer({locale}: {locale: string}) {
    const content = getGlobeguardContent(locale);

    return (
        <footer className="w-full bg-[#0E1E4B] py-16 text-white border-t border-slate-800">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-12">
                    {/* Products Column */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4594E1] mb-4">Products</h4>
                        <ul className="space-y-2 text-sm text-[#D9DEE8]">
                            <li>
                                <NavigationLink locale={locale} href="/search?q=BASIC" className="transition-colors hover:text-white">
                                    GlobeGuard Basic
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink locale={locale} href="/search?q=Camper" className="transition-colors hover:text-white">
                                    GlobeGuard Camper
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink locale={locale} href="/search?q=PRO" className="transition-colors hover:text-white">
                                    GlobeGuard Pro
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink locale={locale} href="/search?q=Elite" className="transition-colors hover:text-white">
                                    GlobeGuard Elite
                                </NavigationLink>
                            </li>
                        </ul>
                    </div>

                    {/* Supported Vehicles Column */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4594E1] mb-4">Supported Vehicles</h4>
                        <ul className="space-y-2 text-sm text-[#D9DEE8]">
                            <li><a href="#supported-vehicles" className="transition-colors hover:text-white">Cars</a></li>
                            <li><a href="#supported-vehicles" className="transition-colors hover:text-white">Motorcycles</a></li>
                            <li><a href="#supported-vehicles" className="transition-colors hover:text-white">Campers</a></li>
                            <li><a href="#supported-vehicles" className="transition-colors hover:text-white">Trucks</a></li>
                            <li><a href="#supported-vehicles" className="transition-colors hover:text-white">Commercial Vehicles</a></li>
                            <li><a href="#supported-vehicles" className="transition-colors hover:text-white">Special Vehicles</a></li>
                        </ul>
                    </div>

                    {/* Software Licenses Column */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4594E1] mb-4">Software Licenses</h4>
                        <ul className="space-y-2 text-sm text-[#D9DEE8]">
                            <li><a href="#software-licenses" className="transition-colors hover:text-white">Brand Modules</a></li>
                            <li><a href="#software-licenses" className="transition-colors hover:text-white">Activation Keys</a></li>
                            <li><a href="#software-licenses" className="transition-colors hover:text-white">Update Subscriptions</a></li>
                            <li><a href="#software-licenses" className="transition-colors hover:text-white">SGW Bypass License</a></li>
                        </ul>
                    </div>

                    {/* Remote Diagnostics Column */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4594E1] mb-4">Remote Diagnostics</h4>
                        <ul className="space-y-2 text-sm text-[#D9DEE8]">
                            <li><a href="#remote-diagnostics" className="transition-colors hover:text-white">How It Works</a></li>
                            <li><a href="#remote-diagnostics" className="transition-colors hover:text-white">Partner Workshops</a></li>
                            <li><a href="#remote-diagnostics" className="transition-colors hover:text-white">Request Support</a></li>
                            <li><a href="#remote-diagnostics" className="transition-colors hover:text-white">Hardware Requirements</a></li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4594E1] mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-[#D9DEE8]">
                            <li><NavigationLink locale={locale} href="/support" className="transition-colors hover:text-white">About Us</NavigationLink></li>
                            <li><a href="#elite" className="transition-colors hover:text-white">Enterprise Elite</a></li>
                            <li><NavigationLink locale={locale} href="/partners" className="transition-colors hover:text-white">Partnerships</NavigationLink></li>
                            <li><NavigationLink locale={locale} href="/contact" className="transition-colors hover:text-white">Careers</NavigationLink></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4594E1] mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-[#D9DEE8]">
                            <li><NavigationLink locale={locale} href="/contact" className="transition-colors hover:text-white">Privacy Policy</NavigationLink></li>
                            <li><NavigationLink locale={locale} href="/contact" className="transition-colors hover:text-white">Terms of Service</NavigationLink></li>
                            <li><NavigationLink locale={locale} href="/contact" className="transition-colors hover:text-white">Refund Policy</NavigationLink></li>
                            <li><NavigationLink locale={locale} href="/contact" className="transition-colors hover:text-white">Impressum</NavigationLink></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 text-sm text-[#D9DCE5]">
                        <div className="flex items-center gap-3">
                            <NavigationLink locale={locale} href="/">
                                <GlobeguardBrand className="brightness-0 invert h-7" />
                            </NavigationLink>
                            <span className="text-xs border border-slate-700 rounded px-2 py-0.5 font-mono text-[#D9DEE8]">CH-Cham</span>
                        </div>
                        <p>{content.contact.title} &bull; {content.contact.address.join(', ')}</p>
                        <p className="text-xs text-slate-400">VAT: {content.contact.vat} &bull; Tel: {content.contact.phone}</p>
                    </div>

                    <div className="text-xs text-slate-400 flex flex-col md:flex-row gap-4 md:items-center">
                        <p>&copy; {COPYRIGHT_YEAR} GlobeGuard GmbH. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-emerald-400">
                            <span className="status-dot-green scale-75" />
                            <span>Dealer-Level Infrastructure Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}