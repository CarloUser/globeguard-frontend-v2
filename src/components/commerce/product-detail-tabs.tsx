'use client';

import {useState} from 'react';
import {Cable, Cpu, FileCheck2, PackageCheck, SearchCode, Settings2, ShieldCheck} from 'lucide-react';
import type {ProductCompatibility} from '@/lib/vendure/compatibility';

type ProductTab = 'overview' | 'compatibility' | 'contents';

interface ProductDetailTabsProps {
    productName: string;
    productCompatibility: ProductCompatibility | null;
}

const tabs: Array<{id: ProductTab; label: string}> = [
    {id: 'overview', label: 'Overview'},
    {id: 'compatibility', label: 'Vehicle Compatibility'},
    {id: 'contents', label: 'Package Contents'},
];

function getPackageContents(productName: string) {
    const name = productName.toLowerCase();

    if (/(adapter|cable|kabel|stecker)/.test(name)) {
        return [
            {title: 'Selected adapter or cable', description: 'Hardware matched to the connector family shown in the product title.'},
            {title: 'Connection guidance', description: 'Basic usage guidance for connecting the adapter to the GlobeGuard interface.'},
            {title: 'Compatibility support', description: 'Brand-level compatibility can be checked before use or purchase.'},
        ];
    }

    if (/(software|update|license|lizenz|sgw|gateway)/.test(name)) {
        return [
            {title: 'Software/license activation', description: 'Activation path for the selected GlobeGuard software or gateway function.'},
            {title: 'Account and update access', description: 'Access details depend on the selected product and support workflow.'},
            {title: 'Compatibility support', description: 'Support can confirm the matching brand coverage before activation.'},
        ];
    }

    return [
        {title: 'GlobeGuard diagnostic interface', description: 'The main interface for reading and clearing supported vehicle faults.'},
        {title: 'OBD connection lead', description: 'Standard connection path for supported cars, vans, campers, and related groups.'},
        {title: 'Brand module / setup access', description: 'The selected BASIC or PRO coverage is prepared around brand-level compatibility.'},
        {title: 'Setup and support guidance', description: 'Practical guidance for updates, adapters, and remote support workflows.'},
    ];
}

export function ProductDetailTabs({productName, productCompatibility}: ProductDetailTabsProps) {
    const [activeTab, setActiveTab] = useState<ProductTab>('overview');
    const packageContents = getPackageContents(productName);

    return (
        <div className="lg:col-span-2">
            <div className="mb-8 flex gap-8 overflow-x-auto border-b border-black/5 dark:border-white/10" role="tablist" aria-label="Product details">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            id={`product-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`product-panel-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 pb-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                                isActive
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-slate-500 hover:text-[#101820] dark:hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'overview' && (
                <div id="product-panel-overview" role="tabpanel" aria-labelledby="product-tab-overview" className="max-w-none">
                    <h3 className="mb-4 text-2xl font-bold">Workshop power in your glovebox</h3>
                    <p className="mb-6 text-slate-600 dark:text-slate-300">
                        GlobeGuard products bridge the gap between basic code readers and workshop machines, with practical coverage for real travel and service situations.
                    </p>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {[
                            {icon: Cpu, title: 'OBD diagnostics', desc: 'Read, clear, and interpret vehicle faults with clear product paths.'},
                            {icon: Settings2, title: 'Update ready', desc: 'Software and compatibility updates stay part of the product lifecycle.'},
                            {icon: ShieldCheck, title: 'SGW support', desc: 'Security Gateway license paths are part of the shop structure.'},
                            {icon: SearchCode, title: 'Remote workflow', desc: 'Support can continue when the vehicle is away from the workshop.'},
                        ].map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="flex gap-4">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-bold">{feature.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{feature.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'compatibility' && (
                <div id="product-panel-compatibility" role="tabpanel" aria-labelledby="product-tab-compatibility" className="max-w-none">
                    <h3 className="mb-4 text-2xl font-bold">Brand Compatibility</h3>
                    <p className="mb-6 text-slate-600 dark:text-slate-300">
                        Compatibility is maintained at brand and vehicle-group level. Model and year-specific locking is not part of the current catalog data.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-black/5 dark:border-white/10">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F0F6F9] text-mono-label dark:bg-white/5">
                                <tr>
                                    <th className="p-4">Brand</th>
                                    <th className="p-4">Coverage</th>
                                    <th className="p-4">Gateway / Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                {productCompatibility?.rows.length ? productCompatibility.rows.map((row) => (
                                    <tr key={`${row.vehicleGroup}-${row.brand}`} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                        <td className="p-4 font-bold text-[#101820] dark:text-white">{row.brand}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            {row.basicSupport ? `Brand-level BASIC: ${row.basicSupport}` : row.proSupport ? 'Brand-level PRO diagnostics supported' : 'Brand rule imported'}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            {[row.sgwBypass, row.sgwLicense, row.note].filter(Boolean).join(' / ') || 'No extra note'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-slate-600 dark:text-slate-300">
                                            Brand compatibility data will appear here after the GlobeGuard catalog import.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'contents' && (
                <div id="product-panel-contents" role="tabpanel" aria-labelledby="product-tab-contents" className="max-w-none">
                    <h3 className="mb-4 text-2xl font-bold">Package Contents</h3>
                    <p className="mb-6 text-slate-600 dark:text-slate-300">
                        Contents are structured from the catalog product family. Replace this with exact packing-list data once product assets and bundle details are finalized.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {packageContents.map((item, index) => {
                            const Icon = index === 0 ? PackageCheck : index === 1 ? Cable : FileCheck2;
                            return (
                                <div key={item.title} className="rounded-lg border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="size-5" />
                                    </div>
                                    <h4 className="font-bold text-[#101820] dark:text-white">{item.title}</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}