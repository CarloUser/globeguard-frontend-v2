'use client';

import { useState } from 'react';
import { 
    Cpu, 
    Car, 
    Laptop, 
    Network, 
    ShieldCheck, 
    Check, 
    Copy, 
    Search, 
    Compass, 
    ChevronDown,
    CheckCircle2,
    Users,
    HardDrive,
    Database,
    ArrowRight
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

// --- IMAGE PLACEHOLDER COMPONENT ---
interface ImagePlaceholderProps {
    name: string;
    purpose: string;
    prompt: string;
    aspectRatio: string;
    placement: string;
    iconType: 'hero' | 'basic' | 'camper' | 'elite' | 'diagram' | 'mockup';
    src?: string;
}

export function ImagePlaceholder({
    name,
    purpose,
    prompt,
    aspectRatio,
    placement,
    iconType,
    src
}: ImagePlaceholderProps) {
    const [copied, setCopied] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const getIcon = () => {
        switch (iconType) {
            case 'hero': return <Cpu className="size-10 text-primary" />;
            case 'basic': return <Car className="size-10 text-primary" />;
            case 'camper': return <Compass className="size-10 text-primary" />;
            case 'elite': return <ShieldCheck className="size-10 text-primary" />;
            case 'diagram': return <Network className="size-10 text-primary" />;
            case 'mockup': return <Laptop className="size-10 text-primary" />;
            default: return <HardDrive className="size-10 text-primary" />;
        }
    };

    if (src) {
        return (
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 shadow-sm transition-all duration-300 hover:shadow-md border border-slate-250/40 dark:border-slate-800">
                <img 
                    src={src} 
                    alt={name} 
                    className={cn(
                        "h-full w-full transition-transform duration-500 hover:scale-[1.02]",
                        iconType === 'diagram' ? "object-contain bg-white dark:bg-[#060D22]" : "object-cover"
                    )}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-[300px] flex-col rounded-xl border-2 border-dashed border-slate-300 bg-[#F7F9FC] p-6 text-[#0E1E4B] transition-all hover:border-primary/50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-white">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800">
                    {getIcon()}
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-primary font-bold">Image Requirement</div>
                <h4 className="mt-1 text-lg font-bold">{name}</h4>
                <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{purpose}</p>
                
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="rounded bg-slate-200/60 px-2.5 py-1 dark:bg-slate-800">Aspect Ratio: <strong className="text-[#0E1E4B] dark:text-white">{aspectRatio}</strong></span>
                    <span className="rounded bg-slate-200/60 px-2.5 py-1 dark:bg-slate-800">Placement: <strong className="text-[#0E1E4B] dark:text-white">{placement}</strong></span>
                </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-primary hover:underline"
                >
                    <span>{showPrompt ? 'Hide AI Prompt Settings' : 'Show AI Image Prompt & Details'}</span>
                    <ChevronDown className={cn("size-4 transition-transform", showPrompt && "rotate-180")} />
                </button>

                {showPrompt && (
                    <div className="mt-3 rounded-lg bg-slate-100 p-4 dark:bg-slate-950/80">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">Midjourney / DALL-E Prompt</span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                {copied ? (
                                    <>
                                        <Check className="size-3 text-emerald-500" />
                                        <span className="text-emerald-500">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3" />
                                        <span>Copy Prompt</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-650 dark:text-slate-350 select-all font-mono">
                            {prompt}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUPPORTED VEHICLES COMPONENT ---
interface Brand {
    name: string;
    logo: string;
    categories: ('cars' | 'motorcycles' | 'campers' | 'trucks' | 'commercial' | 'special')[];
}

const VEHICLE_BRANDS: Brand[] = [
    { name: 'BMW', logo: '/brand-logos/bmw.svg', categories: ['cars'] },
    { name: 'Mercedes-Benz', logo: '/brand-logos/mercedes-benz.svg', categories: ['cars', 'campers', 'trucks', 'commercial'] },
    { name: 'Audi', logo: '/brand-logos/audi.svg', categories: ['cars'] },
    { name: 'Volkswagen', logo: '/brand-logos/volkswagen.svg', categories: ['cars', 'campers'] },
    { name: 'Porsche', logo: '/brand-logos/porsche.svg', categories: ['cars'] },
    { name: 'Toyota', logo: '/brand-logos/toyota.svg', categories: ['cars'] },
    { name: 'Ford', logo: '/brand-logos/ford.svg', categories: ['cars', 'campers', 'commercial'] },
    { name: 'Volvo', logo: '/brand-logos/volvo.svg', categories: ['cars', 'trucks'] },
    { name: 'Honda', logo: '/brand-logos/honda.svg', categories: ['cars', 'motorcycles'] },
    { name: 'Kia', logo: '/brand-logos/kia.svg', categories: ['cars'] },
    { name: 'Hyundai', logo: '/brand-logos/hyundai.svg', categories: ['cars'] },
    { name: 'Renault', logo: '/brand-logos/renault.svg', categories: ['cars', 'commercial'] },
    { name: 'Nissan', logo: '/brand-logos/nissan.svg', categories: ['cars'] },
    { name: 'Ducati', logo: '/brand-logos/ducati.svg', categories: ['motorcycles'] },
    { name: 'Harley-Davidson', logo: '/brand-logos/harley-davidson.svg', categories: ['motorcycles'] },
    { name: 'KTM', logo: '/brand-logos/ktm.svg', categories: ['motorcycles'] },
    { name: 'Yamaha', logo: '/brand-logos/yamaha.svg', categories: ['motorcycles'] },
    { name: 'Scania', logo: '/brand-logos/scania.svg', categories: ['trucks'] },
    { name: 'MAN', logo: '/brand-logos/man.svg', categories: ['trucks', 'commercial'] },
    { name: 'Iveco', logo: '/brand-logos/iveco.svg', categories: ['trucks', 'commercial', 'campers'] },
    { name: 'Truma', logo: '/brand-logos/truma.svg', categories: ['special'] },
    { name: 'Westfalia', logo: '/brand-logos/westfalia.svg', categories: ['campers'] },
    { name: 'Caterpillar', logo: '/brand-logos/caterpillar.svg', categories: ['special'] },
    { name: 'John Deere', logo: '/brand-logos/john-deere.svg', categories: ['special'] },
    { name: 'Daf', logo: '/brand-logos/daf.svg', categories: ['trucks', 'commercial'] },
    { name: 'Tesla', logo: '/brand-logos/tesla.svg', categories: ['cars'] },
    { name: 'Lexus', logo: '/brand-logos/lexus.svg', categories: ['cars'] },
    { name: 'Triumph', logo: '/brand-logos/triumph.svg', categories: ['motorcycles'] },
    { name: 'Fiat Professional', logo: '/brand-logos/fiat-professional.svg', categories: ['campers', 'commercial'] },
    { name: 'Putzmeister', logo: '/brand-logos/putzmeister.svg', categories: ['special'] },
];

interface SupportedVehiclesSelectorProps {
    locale: string;
    translations: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        allCategories: string;
        categories: {
            cars: string;
            motorcycles: string;
            campers: string;
            trucks: string;
            commercial: string;
            special: string;
        };
    };
}

export function SupportedVehiclesSelector({
    translations
}: SupportedVehiclesSelectorProps) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string>('all');
    const [expanded, setExpanded] = useState(false);

    const filteredBrands = VEHICLE_BRANDS.filter(brand => {
        const matchesSearch = brand.name.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === 'all' || brand.categories.includes(activeTab as Brand['categories'][number]);
        return matchesSearch && matchesTab;
    });

    const displayedBrands = expanded ? filteredBrands : filteredBrands.slice(0, 12);

    const tabs = [
        { id: 'all', label: translations.allCategories },
        { id: 'cars', label: translations.categories.cars },
        { id: 'motorcycles', label: translations.categories.motorcycles },
        { id: 'campers', label: translations.categories.campers },
        { id: 'trucks', label: translations.categories.trucks },
        { id: 'commercial', label: translations.categories.commercial },
        { id: 'special', label: translations.categories.special }
    ];

    return (
        <div className="w-full">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-5 dark:border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            setActiveTab(tab.id);
                            setExpanded(false);
                        }}
                        className={cn(
                            "rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-white"
                                : "bg-slate-50 text-[#0E1E4B] hover:bg-slate-100 dark:bg-slate-900 dark:text-[#D9DEE8] dark:hover:bg-slate-800"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative mt-6">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={translations.searchPlaceholder}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus:border-primary dark:focus:bg-slate-950"
                />
            </div>

            {/* Grid of Brands */}
            {filteredBrands.length > 0 ? (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {displayedBrands.map(brand => (
                        <Link
                            key={brand.name}
                            href={`/search?brand=${encodeURIComponent(brand.name)}`}
                            title={brand.name}
                            aria-label={`Open shop page for ${brand.name}`}
                            className="flex min-h-20 flex-col items-center justify-center rounded-lg border border-slate-150 bg-slate-50/50 p-3 text-center transition-all hover:border-primary hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-800 dark:bg-slate-900/20 dark:hover:bg-slate-900/40"
                        >
                            <img
                                src={brand.logo}
                                alt={`${brand.name} logo`}
                                className="max-h-7 max-w-[104px] object-contain opacity-85 grayscale contrast-125 dark:invert"
                            />
                            <div className="mt-2 flex flex-wrap justify-center gap-1">
                                {brand.categories.map(cat => (
                                    <span
                                        key={cat}
                                        className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-8 py-10 text-center text-sm text-slate-400">
                    No brands found matching your search.
                </div>
            )}

            {/* Expandable trigger (Expandable UX Concept) */}
            {filteredBrands.length > 12 && (
                <div className="mt-8 text-center pt-4">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-[#0E1E4B] shadow-sm transition-all hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                        <span>{expanded ? 'Show Less Brands' : `Show All ${filteredBrands.length} Supported Brands`}</span>
                        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
                    </button>
                </div>
            )}
        </div>
    );
}

// --- FAQ ACCORDION COMPONENT ---
interface FAQItem {
    readonly q: string;
    readonly a: string;
}

interface FAQAccordionSectionProps {
    readonly list: readonly FAQItem[];
}

export function FAQAccordionSection({ list }: FAQAccordionSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleIndex = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="mx-auto max-w-3xl space-y-3">
            {list.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <div 
                        key={index} 
                        className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-950"
                    >
                        <button
                            type="button"
                            onClick={() => toggleIndex(index)}
                            className="flex w-full items-center justify-between p-5 text-left text-base font-bold text-[#0E1E4B] dark:text-white"
                        >
                            <span>{item.q}</span>
                            <span className={cn(
                                "flex size-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all dark:bg-slate-900 dark:text-slate-400",
                                isOpen && "bg-primary/10 text-primary rotate-180"
                            )}>
                                <ChevronDown className="size-4" />
                            </span>
                        </button>
                        {isOpen && (
                            <div className="border-t border-slate-100 p-5 text-sm leading-relaxed text-slate-650 dark:border-slate-800 dark:text-slate-350">
                                {item.a}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// --- REMOTE DIAGNOSTICS INTERACTIVE FLOW ---
interface RemoteDiagnosticsFlowProps {
    readonly steps: readonly {
        readonly step: string;
        readonly title: string;
        readonly desc: string;
    }[];
}

export function RemoteDiagnosticsFlow({ steps }: RemoteDiagnosticsFlowProps) {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <div className="grid gap-12 lg:grid-cols-12 lg:items-stretch">
            {/* Left: Sleek Vertical Timeline Stepper */}
            <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 pl-8 space-y-6">
                    {steps.map((item, index) => {
                        const isActive = activeStep === index;
                        return (
                            <div
                                key={index}
                                onClick={() => setActiveStep(index)}
                                className="relative cursor-pointer group transition-all"
                            >
                                {/* Active Node Glow / Indicator */}
                                <div className={cn(
                                    "absolute -left-[41px] top-1.5 flex size-6 items-center justify-center rounded-full border bg-white transition-all duration-300 dark:bg-slate-950",
                                    isActive 
                                        ? "border-primary bg-primary text-white scale-110 shadow-md shadow-primary/20" 
                                        : "border-slate-350 hover:border-slate-400 dark:border-slate-800 text-slate-450 dark:text-slate-500"
                                )}>
                                    <span className="text-[10px] font-mono font-bold">{item.step}</span>
                                </div>

                                <div className="space-y-1">
                                    <h4 className={cn(
                                        "text-base font-bold text-[#0E1E4B] transition-colors dark:text-white",
                                        isActive ? "text-primary dark:text-accent" : "group-hover:text-primary/70 dark:group-hover:text-accent/70"
                                    )}>
                                        {item.title}
                                    </h4>
                                    <p className={cn(
                                        "text-xs leading-relaxed transition-all duration-300",
                                        isActive ? "text-slate-650 dark:text-slate-300" : "text-slate-450 dark:text-slate-500"
                                    )}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: High-Trust Adaptive Diagnostic Terminal Console */}
            <div className="lg:col-span-7 flex">
                <div className="flex flex-col w-full rounded-2xl bg-slate-50 border border-slate-200 p-6 shadow-md dark:bg-slate-950 dark:border-slate-850 relative overflow-hidden font-mono text-xs text-slate-705 dark:text-slate-300 min-h-[380px] transition-all">
                    {/* Terminal Title Bar */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5 shrink-0 dark:border-slate-850">
                        <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-red-500/80" />
                            <span className="size-2.5 rounded-full bg-yellow-500/80" />
                            <span className="size-2.5 rounded-full bg-green-500/80" />
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-2">session_bridge_tunnel.sh</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-[9px] text-emerald-600 dark:text-emerald-500 font-bold border border-slate-200 dark:border-emerald-950/50">
                            <span className="size-1.5 rounded-full bg-emerald-550 dark:bg-emerald-500 animate-pulse" />
                            <span>PORT 443 SECURE</span>
                        </div>
                    </div>

                    {/* Console Screen Output */}
                    <div className="flex-1 flex flex-col justify-center">
                        {activeStep === 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-center gap-6 items-center py-2">
                                    <div className="rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 p-4">
                                        <Car className="size-8 text-primary animate-pulse" />
                                    </div>
                                    <div className="h-0.5 w-12 border-t border-dashed border-primary animate-pulse" />
                                    <div className="rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 p-4">
                                        <Cpu className="size-8 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <p className="text-sm font-bold text-[#0E1E4B] dark:text-white font-sans">OBD-II Hardware Connected</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Handshake established. Device GG-OBD-01 detected.</p>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-905/60 rounded p-3 border border-slate-200 dark:border-slate-850 text-[10px] space-y-0.5 text-slate-500 dark:text-slate-400 max-w-sm mx-auto shadow-sm">
                                    <div>$ gg-tunnel --init-handshake</div>
                                    <div className="text-emerald-600 dark:text-emerald-500 font-bold">✔ Secure SSL/TLS handshake complete.</div>
                                    <div className="text-slate-405 dark:text-slate-500">Adapter VIN Check: WBA3A5C52HN****** [OK]</div>
                                </div>
                            </div>
                        )}

                        {activeStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-center gap-6 items-center py-2">
                                    <div className="rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 p-4">
                                        <Cpu className="size-8 text-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="h-0.5 w-12 border-t border-dashed border-emerald-500/50 animate-pulse" />
                                    <div className="rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 p-4">
                                        <Users className="size-8 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <p className="text-sm font-bold text-[#0E1E4B] dark:text-white font-sans">Technician Bridge Online</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Authorized GlobeGuard partner mechanic is connected.</p>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-905/60 rounded p-3 border border-slate-200 dark:border-slate-850 text-[10px] space-y-0.5 text-slate-500 dark:text-slate-400 max-w-sm mx-auto shadow-sm">
                                    <div>$ gg-bridge --status --client-id=1849</div>
                                    <div className="text-emerald-600 dark:text-emerald-500 font-bold">✔ Technician ID #08492 (Zurich Workshop) Connected</div>
                                    <div className="text-slate-405 dark:text-slate-500">Security Gateway (SGW) Bypass Payload... [INJECTED]</div>
                                </div>
                            </div>
                        )}

                        {activeStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg p-4 max-w-xs mx-auto text-left space-y-2 shadow-sm">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-red-650 dark:text-red-500 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                                        <span>SYSTEM DIAG SCAN ACTIVE</span>
                                        <span className="animate-pulse">● BUS BUSY</span>
                                    </div>
                                    <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                                        <div className="flex justify-between"><span>[ABS] Anti-Lock Brakes:</span> <span className="text-emerald-600 dark:text-emerald-500">OK</span></div>
                                        <div className="flex justify-between"><span>[ECM] Engine Control:</span> <span className="text-red-600 dark:text-red-500 font-bold">2 FAULTS</span></div>
                                        <div className="flex justify-between"><span>[TCM] Transmission:</span> <span className="text-emerald-600 dark:text-emerald-500">OK</span></div>
                                        <div className="flex justify-between"><span>[SRS] Airbags Module:</span> <span className="text-emerald-600 dark:text-emerald-500">OK</span></div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-[#0E1E4B] dark:text-white font-sans">ECU Controller Module Scan</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Diagnostic Trouble Code (DTC) check run across CAN-bus.</p>
                                </div>
                            </div>
                        )}

                        {activeStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg p-4 max-w-sm mx-auto text-left space-y-2 shadow-sm">
                                    <div className="text-[10px] font-bold text-red-650 dark:text-red-500 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                                        DIAGNOSED FAULT LOG
                                    </div>
                                    <div className="space-y-1.5 text-[10px]">
                                        <div className="text-[#0E1E4B] dark:text-white font-bold">DTC: P0420 - Catalytic System Efficiency</div>
                                        <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Sensor bank 1 oxygen deviation detected. Software adaptation parameters require reset & calibration.
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-[#0E1E4B] dark:text-white font-sans">Precise Software Issue Localized</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Real-time calibration instructions compiled for mechanic.</p>
                                </div>
                            </div>
                        )}

                        {activeStep === 4 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-center gap-4 items-center py-2">
                                    <div className="rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 p-4">
                                        <Database className="size-8 text-primary" />
                                    </div>
                                    <ArrowRight className="size-4 text-slate-450 dark:text-slate-500" />
                                    <div className="rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 p-4">
                                        <CheckCircle2 className="size-8 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-center">
                                    <p className="text-sm font-bold text-[#0E1E4B] dark:text-white font-sans">Diagnostic Verification Finished</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Codes cleared, adaptation parameters reset. Session closed.</p>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-905/60 rounded p-3 border border-slate-200 dark:border-slate-850 text-[10px] text-slate-600 dark:text-slate-400 max-w-sm mx-auto text-center shadow-sm">
                                    <span className="text-emerald-600 dark:text-emerald-500 font-bold">✔ VEHICLE LOGS SECURED & SYNCHRONIZED</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
