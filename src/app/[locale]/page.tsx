import type { Metadata } from 'next';
import { 
    ArrowRight, 
    BookOpen, 
    Cable, 
    CheckCircle2, 
    Clock, 
    Headphones, 
    PackageCheck, 
    Search, 
    ShieldCheck, 
    Wrench,
    FileText,
    HelpCircle,
    ChevronDown,
    Activity,
    ShieldAlert,
    Cpu,
    Smartphone,
    Laptop,
    Globe,
    Layers,
    Sliders,
    Building2,
    Store,
    Check,
    X,
    MessageSquare,
    Sparkles,
    Network,
    Car,
    Compass,
    HardDrive,
    Truck
} from 'lucide-react';
import { NavigationLink as Link } from '@/components/shared/navigation-link';
import { getRouteLocale } from '@/i18n/server';
import { getGlobeguardContent } from '@/content/globeguard';
import { SITE_NAME, SITE_URL, buildCanonicalUrl } from '@/lib/metadata';
import { toOgLocale } from '@/i18n/locale-utils';
import { CompatibilityWizard } from '@/components/commerce/compatibility-wizard';
import { EMPTY_COMPATIBILITY_OPTIONS, getCompatibilityOptions } from '@/lib/vendure/compatibility';
import { 
    ImagePlaceholder, 
    SupportedVehiclesSelector, 
    FAQAccordionSection, 
    RemoteDiagnosticsFlow 
} from '@/components/commerce/home-interactive-sections';

const homeCopy = {
    en: {
        hero: {
            title: "Dealer-Level Vehicle Diagnostics For Everyone",
            subtitle: "Professional diagnostic devices with workshop-grade functionality for cars, motorcycles, campers, trucks, and commercial vehicles.",
            ctaExplore: "Explore Devices",
            ctaVehicles: "Supported Vehicles"
        },
        trustBar: [
            { title: "Professional Diagnostics", desc: "Workshop-grade scans, coding & adaptations" },
            { title: "Remote Diagnostics", desc: "Connect with global expert workshops live" },
            { title: "Multi-Platform Support", desc: "iOS, Android, Windows & macOS applications" },
            { title: "Worldwide Coverage", desc: "Diagnose vehicles anywhere, anytime" },
            { title: "Workshop-Level Functions", desc: "ECU programming and service resets" }
        ],
        products: {
            title: "Product Ecosystem",
            subtitle: "Select the perfect GlobeGuard system tailored to your diagnostic requirements.",
            learnMore: "Learn More",
            basic: {
                title: "GlobeGuard Basic",
                desc: "For individual vehicle owners and DIY enthusiasts. Clear faults and check real-time data.",
                features: ["Single Brand Group", "Read & Clear Faults", "Live Sensor Data", "iOS & Android Support"]
            },
            pro: {
                title: "GlobeGuard Pro",
                desc: "For professional workshops and advanced mechanics. Brand-expandable software, coding, and security gateway bypass.",
                features: ["Multi-Brand Licensing", "ECU Coding & Adaptations", "Security Gateway Support", "Remote Support Enabled"]
            },
            camper: {
                title: "GlobeGuard Camper",
                desc: "For motorhome and camper travelers. Specialty diagnostics for Truma, SGW, and camper chassis.",
                features: ["Camper Chassis Coverage", "Heating System Diagnoses", "Security Gateway Support", "Offline Scan Mode"]
            },
            elite: {
                title: "GlobeGuard Elite",
                desc: "For workshops, mechanics, and fleet operators. Advanced coding, programming, and remote access.",
                features: ["All Brand Groups", "ECU Coding & Programming", "Active Component Tests", "Remote Diagnostics Hub"]
            }
        },
        comparison: {
            title: "Why GlobeGuard?",
            subtitle: "Compare GlobeGuard against generic handheld scanners.",
            features: [
                { name: "Dealer-Level Diagnostics", gg: true, trad: false },
                { name: "Coding & Programming", gg: true, trad: false },
                { name: "Service Functions (Oil Reset, EPB)", gg: true, trad: "Limited" },
                { name: "ECU Adaptation", gg: true, trad: false },
                { name: "DPF Regeneration", gg: true, trad: false },
                { name: "Battery Registration", gg: true, trad: false },
                { name: "Remote Diagnostics Bridge", gg: true, trad: false },
                { name: "Multi-Brand Support", gg: true, trad: true },
                { name: "Windows / macOS / iOS / Android", gg: true, trad: false }
            ],
            tableHeader: {
                feature: "Feature / Capability",
                globeguard: "GlobeGuard Platform",
                traditional: "Traditional OBD Scanner"
            }
        },
        supportedVehicles: {
            title: "Supported Vehicles & Brands",
            subtitle: "Verify coverage for your specific model. Enter your brand or select a category below.",
            searchPlaceholder: "Search brand (e.g. BMW, MAN, Ducati...)",
            allCategories: "All Vehicles",
            categories: {
                cars: "Cars",
                motorcycles: "Motorcycles",
                campers: "Campers",
                trucks: "Trucks",
                commercial: "Commercial",
                special: "Special Vehicles"
            }
        },
        licenses: {
            title: "Software & Brand Licenses",
            subtitle: "Unlock dealer-level capabilities on demand. How our licensing model works:",
            steps: [
                { title: "1. Buy Device", desc: "Purchase the professional GlobeGuard OBD-II hardware interface." },
                { title: "2. Select Brand", desc: "Choose the vehicle manufacturer group you need to support." },
                { title: "3. Apply License", desc: "Apply the license key directly through your user dashboard." },
                { title: "4. Access Diagnostics", desc: "Perform dealer-level coding, service resets, and adaptions." }
            ]
        },
        remoteDiag: {
            title: "On-Demand Remote Diagnostics",
            subtitle: "Get expert workshop assistance directly through your device, no matter where your vehicle is located.",
            steps: [
                { step: "01", title: "Customer Connects Device", desc: "Plug the GlobeGuard OBD-II interface into the vehicle and connect it to local Wi-Fi or mobile hotspot." },
                { step: "02", title: "Partner Workshop Connects", desc: "An authorized GlobeGuard partner mechanic initiates a secure remote tunnel to your interface." },
                { step: "03", title: "Fault Codes Checked", desc: "The remote specialist reads live sensor data, scans all ECUs, and performs deep troubleshooting." },
                { step: "04", title: "Issues Diagnosed", desc: "You receive a detailed technical report explaining the root cause and recommended repair path." },
                { step: "05", title: "Parts Ordered Worldwide", desc: "Order genuine or OEM parts directly via our integrated global network for immediate delivery." }
            ]
        },
        appEcosystem: {
            title: "Cross-Platform App Ecosystem",
            subtitle: "One dashboard for all devices. Diagnose from your phone in the garage or a laptop in the workshop.",
            platforms: ["iOS App Store", "Google Play Store", "Windows Desktop App", "macOS Desktop Client"]
        },
        industries: {
            title: "Built For Every Industry",
            subtitle: "GlobeGuard scales from individual DIY enthusiasts to international logistics fleets.",
            cards: [
                { title: "Personal Vehicles", desc: "Maintain and code your own family vehicles, campers, and motorbikes." },
                { title: "Workshops & Mechanics", desc: "Expand your shop's capabilities with dealer-level diagnostics without expensive OEM subscriptions." },
                { title: "Camper Travelers", desc: "Peace of mind during remote overland trips with off-grid scans and heating modules diagnostics." },
                { title: "Fleet Operators", desc: "Maximize uptime and manage regular servicing schedules for your corporate vehicles." },
                { title: "Truck Companies", desc: "Execute heavy vehicle diagnostics, DPF regeneration, and trailer adaptations on-site." },
                { title: "Service Centers", desc: "Equip your mobile emergency service vehicles with versatile, rugged diagnostic gear." }
            ]
        },
        elite: {
            title: "GlobeGuard Elite for B2B",
            subtitle: "Enterprise-grade fleet management and commercial workshop solutions.",
            desc: "Equip your entire business with advanced vehicle diagnostics. GlobeGuard Elite includes workshop management software, high-concurrency API integrations, dedicated account managers, and priority 24/7 expert remote support.",
            features: [
                "Workshop & Team Management",
                "Advanced Diagnostics & Multi-Brand Coding",
                "Commercial Heavy-Duty Vehicles & Trailers",
                "Real-time Fleet Health Tracking Dashboard",
                "Enterprise Custom SLA & API Access"
            ],
            cta: "Contact Sales"
        },
        testimonials: {
            title: "Trusted by Automotive Professionals",
            subtitle: "See why mechanics and vehicle owners choose GlobeGuard.",
            list: [
                { quote: "GlobeGuard Elite saved us thousands in OEM diagnostic license fees. The remote diagnostic feature allows us to outsource complex coding jobs directly to brand specialists.", author: "Marcus Schmidt", role: "Workshop Owner, Munich" },
                { quote: "Being able to diagnose my Sprinter motorhome off-grid in Scandinavia gave me absolute peace of mind. Found a minor sensor fault and resolved it myself.", author: "Elena Rostova", role: "Overland Camper Traveler" },
                { quote: "The heavy truck diagnostic features are robust. We run DPF regeneration on our Scania and MAN fleets directly in our yard, reducing downtime significantly.", author: "Thomas O'Connor", role: "Fleet Logistics Manager" }
            ]
        },
        faq: {
            title: "Frequently Asked Questions",
            subtitle: "Find quick answers to common questions about GlobeGuard diagnostics.",
            list: [
                { q: "Which vehicles are supported?", a: "GlobeGuard supports cars, motorcycles, campers, trucks, commercial vehicles, and special industrial machinery. Select your brand in our Supported Vehicles directory to verify coverage." },
                { q: "How do software licenses work?", a: "We sell modular licenses. You buy the hardware device once, and then purchase individual brand licenses or multi-brand packs. Licenses can be activated instantly and do not require ongoing subscriptions for basic diagnostic operations." },
                { q: "What is Remote Diagnostics?", a: "If you encounter a complex issue that requires dealer-level coding or advanced troubleshooting, you can initiate a remote connection. A certified workshop mechanic from our network will connect to your vehicle over the cloud to diagnose and code it remotely." },
                { q: "Do I need a continuous internet connection?", a: "Basic OBD scanning, reading, and clearing of fault codes can be performed completely offline using our mobile or desktop applications. Internet is only required for remote support sessions, software updates, and buying new licenses." },
                { q: "Is security gateway bypass supported?", a: "Yes. GlobeGuard features official support for Security Gateway (SGW) bypass modules, including Stellantis (FCA), Mercedes-Benz, and Renault group vehicles, allowing you to perform adaptations and clear faults on protected newer models." }
            ]
        },
        finalCta: {
            title: "Ready For Professional Vehicle Diagnostics?",
            subtitle: "Equip yourself or your workshop with GlobeGuard's industry-leading OBD-II devices and licenses.",
            ctaShop: "Shop Devices",
            ctaContact: "Contact Sales"
        }
    },
    de: {
        hero: {
            title: "Fahrzeugdiagnose auf Händlerniveau für alle",
            subtitle: "Professionelle Diagnosegeräte mit Werkstatt-Funktionen für Pkw, Motorräder, Reisemobile, Lkw und Nutzfahrzeuge.",
            ctaExplore: "Geräte entdecken",
            ctaVehicles: "Unterstützte Fahrzeuge"
        },
        trustBar: [
            { title: "Professionelle Diagnose", desc: "Scans, Codierung & Anpassung auf Werkstatt-Niveau" },
            { title: "Ferndiagnose", desc: "Live-Verbindung mit globalen Experten-Werkstätten" },
            { title: "Plattformübergreifend", desc: "Applikationen für iOS, Android, Windows & macOS" },
            { title: "Weltweite Abdeckung", desc: "Fahrzeuge überall und jederzeit diagnostizieren" },
            { title: "Werkstatt-Funktionen", desc: "Steuergeräte-Codierung und Service-Resets" }
        ],
        products: {
            title: "Produkt-Ökosystem",
            subtitle: "Wählen Sie das passende GlobeGuard-System für Ihre Diagnoseaufgaben.",
            learnMore: "Mehr erfahren",
            basic: {
                title: "GlobeGuard Basic",
                desc: "Für Fahrzeughalter und DIY-Enthusiasten. Fehler auslesen & löschen, Live-Sensordaten prüfen.",
                features: ["Eine Herstellergruppe", "Fehler lesen & löschen", "Live-Sensordaten", "iOS & Android Support"]
            },
            pro: {
                title: "GlobeGuard Pro",
                desc: "Für professionelle Werkstätten und fortgeschrittene Mechaniker. Erweiterbare Marken-Software, Codierung und SGW-Freischaltung.",
                features: ["Erweiterbare Markenlizenzen", "Codierung & Anpassungen", "Security Gateway Support", "Remote-Hilfe bereit"]
            },
            camper: {
                title: "GlobeGuard Camper",
                desc: "Für Wohnmobil- und Camping-Reisende. Spezialdiagnose für Truma, SGW und Reisemobil-Chassis.",
                features: ["Wohnmobil-Chassis Abdeckung", "Heizungssystem-Diagnose", "Security Gateway Support", "Offline-Scanmodus"]
            },
            elite: {
                title: "GlobeGuard Elite",
                desc: "Für Werkstätten, Mechaniker und Flottenbetreiber. Erweiterte Codierung, Programmierung und Remote-Zugang.",
                features: ["Alle Herstellergruppen", "Steuergeräte-Codierung", "Aktive Stellgliedtests", "Ferndiagnose-Zentrale"]
            }
        },
        comparison: {
            title: "Warum GlobeGuard?",
            subtitle: "Vergleichen Sie GlobeGuard mit herkömmlichen OBD-Handscannern.",
            features: [
                { name: "Diagnose auf Händlerniveau", gg: true, trad: false },
                { name: "Codierung & Programmierung", gg: true, trad: false },
                { name: "Service-Funktionen (Ölreset, EPB)", gg: true, trad: "Eingeschränkt" },
                { name: "Steuergeräte-Anpassung", gg: true, trad: false },
                { name: "DPF-Regeneration", gg: true, trad: false },
                { name: "Batterieregistrierung", gg: true, trad: false },
                { name: "Ferndiagnose-Schnittstelle", gg: true, trad: false },
                { name: "Mehr-Marken-Support", gg: true, trad: true },
                { name: "Windows / macOS / iOS / Android", gg: true, trad: false }
            ],
            tableHeader: {
                feature: "Funktion / Kapazität",
                globeguard: "GlobeGuard Plattform",
                traditional: "Klassischer OBD-Scanner"
            }
        },
        supportedVehicles: {
            title: "Unterstützte Fahrzeuge & Marken",
            subtitle: "Prüfen Sie die Kompatibilität für Ihr Modell. Geben Sie Ihre Marke ein oder wählen Sie eine Kategorie.",
            searchPlaceholder: "Marke suchen (z.B. BMW, MAN, Ducati...)",
            allCategories: "Alle Fahrzeuge",
            categories: {
                cars: "Pkw",
                motorcycles: "Motorräder",
                campers: "Wohnmobile",
                trucks: "Lkw",
                commercial: "Nutzfahrzeuge",
                special: "Spezialfahrzeuge"
            }
        },
        licenses: {
            title: "Software- & Marken-Lizenzen",
            subtitle: "Händlerniveau-Funktionen auf Knopfdruck freischalten. So funktioniert das Lizenzmodell:",
            steps: [
                { title: "1. Gerät kaufen", desc: "Erwerben Sie die professionelle GlobeGuard OBD-II Hardwareschnittstelle." },
                { title: "2. Marke wählen", desc: "Wählen Sie die Fahrzeugherstellergruppe, die Sie unterstützen möchten." },
                { title: "3. Lizenz aktivieren", desc: "Aktivieren Sie den Lizenzcode direkt in Ihrem Benutzerkonto." },
                { title: "4. Diagnose starten", desc: "Führen Sie Codierungen auf Herstellerniveau, Resets und Anpassungen durch." }
            ]
        },
        remoteDiag: {
            title: "Ferndiagnose auf Abruf",
            subtitle: "Holen Sie sich Live-Unterstützung von Markenexperten direkt über Ihr Gerät, egal wo Ihr Fahrzeug steht.",
            steps: [
                { step: "01", title: "Kunde schließt Gerät an", desc: "Stecken Sie den GlobeGuard OBD-II Adapter in Ihr Fahrzeug und verbinden Sie ihn mit einem Hotspot." },
                { step: "02", title: "Partner-Werkstatt verbindet sich", desc: "Ein autorisierter GlobeGuard Partner-Mechaniker baut einen sicheren Tunnel zu Ihrem Adapter auf." },
                { step: "03", title: "Fehlercodes werden geprüft", desc: "Der Remote-Spezialist liest Live-Sensordaten, scannt alle Steuergeräte und startet die Fehlersuche." },
                { step: "04", title: "Problem wird diagnostiziert", desc: "Sie erhalten einen detaillierten Bericht mit Fehlerbeschreibung und empfohlenem Reparaturweg." },
                { step: "05", title: "Teile weltweit bestellen", desc: "Bestellen Sie Original- oder OEM-Ersatzteile direkt über unser Netzwerk für eine schnelle Lieferung." }
            ]
        },
        appEcosystem: {
            title: "Plattformübergreifendes App-System",
            subtitle: "Ein Dashboard für alle Geräte. Diagnose per Smartphone in der Garage oder per Laptop in der Werkstatt.",
            platforms: ["iOS App Store", "Google Play Store", "Windows Desktop App", "macOS Desktop Client"]
        },
        industries: {
            title: "Für jede Branche gebaut",
            subtitle: "GlobeGuard wächst mit Ihren Anforderungen – vom DIYer bis zur internationalen Spedition.",
            cards: [
                { title: "Privatfahrzeuge", desc: "Warten und codieren Sie Ihre eigenen Pkw, Wohnmobile und Motorräder." },
                { title: "Werkstätten & Mechaniker", desc: "Erweitern Sie Ihre Werkstatt um Diagnose auf Händlerniveau ohne teure Hersteller-Abos." },
                { title: "Camping & Reise", desc: "Sicherheit auf Fernreisen durch Offline-Scans und Spezialdiagnose für Heizung & Co." },
                { title: "Flottenbetreiber", desc: "Maximieren Sie die Betriebszeiten und verwalten Sie die Wartung Ihrer Firmenfahrzeuge." },
                { title: "Lkw-Unternehmen", desc: "Führen Sie schwere Nutzfahrzeugdiagnosen, DPF-Regenerationen und Trailer-Anpassungen vor Ort aus." },
                { title: "Service-Zentren", desc: "Statten Sie Pannenhilfe- und Servicefahrzeuge mit robuster, vielseitiger Diagnostik aus." }
            ]
        },
        elite: {
            title: "GlobeGuard Elite für B2B",
            subtitle: "Flottenmanagement und Profi-Werkstattlösungen auf Enterprise-Niveau.",
            desc: "Rüsten Sie Ihren Betrieb mit führender Fahrzeugdiagnose aus. GlobeGuard Elite umfasst Werkstatt-Software, API-Integrationen, persönliche Ansprechpartner und priorisierten 24/7 Remote-Support.",
            features: [
                "Werkstatt- & Teamverwaltung",
                "Erweiterte Diagnose & Mehr-Marken-Codierung",
                "Schwere Nutzfahrzeuge & Trailer Support",
                "Live-Zustands-Dashboard für Flotten",
                "Unternehmenstarife mit SLA & API-Zugang"
            ],
            cta: "Kontakt aufnehmen"
        },
        testimonials: {
            title: "Von Profis empfohlen",
            subtitle: "Warum Mechaniker und Fahrzeughalter auf GlobeGuard vertrauen.",
            list: [
                { quote: "Mit GlobeGuard Elite sparen wir jährlich Tausende an OEM-Lizenzgebühren. Dank der Ferndiagnose können wir Programmierungen an externe Spezialisten auslagern.", author: "Marcus Schmidt", role: "Werkstattinhaber, München" },
                { quote: "Die Möglichkeit, mein Sprinter-Wohnmobil offline in Skandinavien zu scannen, gab mir extreme Sicherheit. Einen Sensorfehler konnte ich selbst beheben.", author: "Elena Rostova", role: "Overland Camping-Reisende" },
                { quote: "Die Lkw-Diagnosefunktionen sind herausragend. Wir führen DPF-Regenerationen an unseren Scania- und MAN-Flotten direkt auf dem Hof durch.", author: "Thomas O'Connor", role: "Flotten-Logistikmanager" }
            ]
        },
        faq: {
            title: "Häufig gestellte Fragen",
            subtitle: "Schnelle Antworten auf die wichtigsten Fragen rund um GlobeGuard.",
            list: [
                { q: "Welche Fahrzeuge werden unterstützt?", a: "GlobeGuard unterstützt Pkw, Motorräder, Wohnmobile, Lkw, Nutzfahrzeuge und industrielle Sondermaschinen. Wählen Sie Ihre Marke in unserem Verzeichnis, um die Abdeckung zu prüfen." },
                { q: "Wie funktionieren die Software-Lizenzen?", a: "Wir nutzen ein modulares Lizenzmodell. Sie kaufen die Hardware einmalig und erwerben dann Marken-Lizenzen oder Pakete. Lizenzen sind sofort aktiv und erfordern kein Zwangs-Abo." },
                { q: "Was ist die Ferndiagnose?", a: "Bei komplexen Codierungen oder tiefen Steuergeräte-Anpassungen können Sie eine Remote-Verbindung starten. Ein zertifizierter Mechaniker aus unserem Netzwerk wählt sich ein und übernimmt die Aufgabe aus der Ferne." },
                { q: "Benötige ich eine ständige Internetverbindung?", a: "Standarddiagnosen, Fehler auslesen und löschen funktionieren komplett offline über unsere Apps. Internet wird nur für Updates, Lizenzkäufe und Ferndiagnosen benötigt." },
                { q: "Wird der Security Gateway (SGW) Bypass unterstützt?", a: "Ja. GlobeGuard bietet offiziellen Support für SGW-Bypass-Protokolle, z. B. bei Stellantis (FCA), Mercedes-Benz und Renault, um Anpassungen auch an geschützten neuen Modellen durchzuführen." }
            ]
        },
        finalCta: {
            title: "Bereit für professionelle Fahrzeugdiagnose?",
            subtitle: "Statten Sie sich oder Ihre Werkstatt mit den führenden OBD-II Diagnoseadaptern und Lizenzen aus.",
            ctaShop: "Geräte kaufen",
            ctaContact: "Vertrieb kontaktieren"
        }
    }
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);
    const ogLocale = toOgLocale(locale);

    return {
        metadataBase: new URL(SITE_URL),
        title: {
            absolute: SITE_NAME + ' - ' + content.homeMeta.pageTitle,
        },
        description: content.homeMeta.description,
        alternates: {
            canonical: buildCanonicalUrl('/' + locale),
        },
        openGraph: {
            title: SITE_NAME + ' - ' + content.homeMeta.pageTitle,
            description: content.homeMeta.description,
            type: 'website',
            locale: ogLocale,
            url: buildCanonicalUrl('/' + locale),
        },
    };
}

export default async function Home() {
    const locale = await getRouteLocale();
    const copy = locale === 'de' ? homeCopy.de : homeCopy.en;
    const compatibilityOptions = await getCompatibilityOptions(locale).catch(() => EMPTY_COMPATIBILITY_OPTIONS);

    return (
        <main className="flex w-full flex-col bg-[#F7F9FC] dark:bg-[#060D22]">
            {/* HERO SECTION */}
            <section 
                className="relative bg-slate-950 pt-32 pb-24 md:pt-36 md:pb-28 overflow-hidden border-b border-slate-850 bg-cover bg-center bg-no-repeat text-white"
                style={{ backgroundImage: "url('/hero-banner-bg.png')" }}
            >
                {/* Beautiful dark overlay for premium high contrast and readability */}
                <div className="absolute inset-0 bg-slate-950/75 dark:bg-slate-950/80 backdrop-blur-[1px] mix-blend-multiply" />
                
                <div className="relative container mx-auto px-4 lg:px-8 z-10 text-center">
                    <div className="max-w-4xl mx-auto space-y-6">
                        
                        <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl tracking-tight max-w-3xl mx-auto">
                            {copy.hero.title}
                        </h1>
                        
                        <p className="text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto">
                            {copy.hero.subtitle}
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 pt-2 pb-6">
                            <Link 
                                href="/search" 
                                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/95 hover:-translate-y-[2px]"
                            >
                                {copy.hero.ctaExplore}
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                            <a 
                                href="#supported-vehicles" 
                                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-[2px]"
                            >
                                {copy.hero.ctaVehicles}
                            </a>
                        </div>

                        {/* Compact Compatibility Wizard right in the Hero! */}
                        <div className="pt-2 max-w-4xl mx-auto">
                            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-primary font-mono">Self Explanatory</div>
                            <CompatibilityWizard options={compatibilityOptions} locale={locale} compact={true} />
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST / BRAND BAR */}
            <section className="bg-slate-50 py-10 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {copy.trustBar.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-slate-200/60 shadow-sm dark:bg-slate-900/40 dark:border-slate-850"
                            >
                                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                                    {idx === 0 && <Wrench className="size-5" />}
                                    {idx === 1 && <Network className="size-5" />}
                                    {idx === 2 && <Laptop className="size-5" />}
                                    {idx === 3 && <Globe className="size-5" />}
                                    {idx === 4 && <Cpu className="size-5" />}
                                </div>
                                <h3 className="text-sm font-bold text-[#0E1E4B] dark:text-white">{item.title}</h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRODUCT ECOSYSTEM SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-250 dark:border-slate-800 scroll-mt-24" id="products">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.products.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.products.subtitle}</p>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* GlobeGuard Basic */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 h-[220px]">
                                <ImagePlaceholder
                                    name="GlobeGuard Basic Device"
                                    purpose="Display the consumer-level compact OBD-II scan tool."
                                    prompt="Studio photograph of a compact pocket-sized OBD-II dongle. Matte white body with clean blue (#0083C2) rubber grip bumper. Single LED indicator light glowing softly green. The background is a clean white reflective tabletop. Premium catalog style, photorealistic."
                                    aspectRatio="16:9"
                                    placement="Top half of Basic Product Card"
                                    iconType="basic"
                                    src="/GlobeGuard-Basic-Device.png"
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-[#0E1E4B] dark:text-white">{copy.products.basic.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">
                                    {copy.products.basic.desc}
                                </p>
                                <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    {copy.products.basic.features.map(f => (
                                        <li key={f} className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            <Check className="mr-2 size-4 text-emerald-500 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link 
                                    href="/search?q=BASIC" 
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
                                >
                                    {copy.products.learnMore}
                                </Link>
                            </div>
                        </div>

                        {/* GlobeGuard Pro */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 h-[220px]">
                                <ImagePlaceholder
                                    name="GlobeGuard Pro Device"
                                    purpose="Display the professional-grade handheld OBD-II diagnostic device."
                                    prompt="Studio photograph of a professional-grade robust handheld automotive diagnostic device. A solid dark gray and blue body with ruggedized rubber grip edges. Features a sharp, high-contrast color LCD screen displaying live vehicle telemetry graphs. A high-quality heavy OBD-II connector cable is attached to the top. Shot on a clean neutral metallic studio background. Premium catalog style, photorealistic."
                                    aspectRatio="16:9"
                                    placement="Top half of Pro Product Card"
                                    iconType="mockup"
                                    src="/GlobeGuard-Pro-Device.png"
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-[#0E1E4B] dark:text-white">{copy.products.pro.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">
                                    {copy.products.pro.desc}
                                </p>
                                <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    {copy.products.pro.features.map(f => (
                                        <li key={f} className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            <Check className="mr-2 size-4 text-emerald-500 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link 
                                    href="/search?q=PRO" 
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
                                >
                                    {copy.products.learnMore}
                                </Link>
                            </div>
                        </div>

                        {/* GlobeGuard Camper */}
                        <div className="flex flex-col rounded-2xl border-2 border-primary bg-white p-6 shadow-md dark:bg-slate-900 relative">
                            <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-primary px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                Traveler Favorite
                            </div>
                            <div className="mb-6 h-[220px]">
                                <ImagePlaceholder
                                    name="GlobeGuard Camper Pack"
                                    purpose="Display the traveler specialty OBD-II set including SGW cables and carrying case."
                                    prompt="Flatlay product photography of a professional diagnostic camper kit. Includes a rugged semi-hard zip case in black, a premium black and blue OBD-II interface, three vehicle adapter bypass cables with yellow and red plugs (Truma, Stellantis SGW), and a small quick-start guide booklet. Laid out symmetrically on a light concrete backdrop. 8k, industrial look."
                                    aspectRatio="16:9"
                                    placement="Top half of Camper Product Card"
                                    iconType="camper"
                                    src="/GlobeGuard-Camper-Pack.png"
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-[#0E1E4B] dark:text-white">{copy.products.camper.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">
                                    {copy.products.camper.desc}
                                </p>
                                <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    {copy.products.camper.features.map(f => (
                                        <li key={f} className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            <Check className="mr-2 size-4 text-emerald-500 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link 
                                    href="/search?q=Camper" 
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/90"
                                >
                                    {copy.products.learnMore}
                                </Link>
                            </div>
                        </div>

                        {/* GlobeGuard Elite */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 h-[220px]">
                                <ImagePlaceholder
                                    name="GlobeGuard Elite Set"
                                    purpose="Display the workstation-grade rugged diagnostic laptop set."
                                    prompt="Studio shot of an enterprise-grade automotive diagnostics workstation kit. Features a heavy-duty ruggedized diagnostic tablet with rubber corner bumpers displaying a vehicle dashboard interface, a large multi-brand OBD-II scanner device, and a collection of colored connector cables. Professional layout, isolated on a slate gray premium surface. Cinematic style."
                                    aspectRatio="16:9"
                                    placement="Top half of Elite Product Card"
                                    iconType="elite"
                                    src="/GlobeGuard-Elite-Set.png"
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-[#0E1E4B] dark:text-white">{copy.products.elite.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">
                                    {copy.products.elite.desc}
                                </p>
                                <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                                    {copy.products.elite.features.map(f => (
                                        <li key={f} className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            <Check className="mr-2 size-4 text-emerald-500 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <a 
                                    href="#elite" 
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
                                >
                                    {copy.products.learnMore}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY GLOBEGUARD SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.comparison.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.comparison.subtitle}</p>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 font-bold text-[#0E1E4B] dark:border-slate-800 dark:bg-slate-900/60 dark:text-white">
                                    <th className="p-5 font-bold">{copy.comparison.tableHeader.feature}</th>
                                    <th className="p-5 text-primary font-bold">{copy.comparison.tableHeader.globeguard}</th>
                                    <th className="p-5 font-bold">{copy.comparison.tableHeader.traditional}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {copy.comparison.features.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                        <td className="p-5 font-semibold text-[#0E1E4B] dark:text-[#D9DEE8]">{row.name}</td>
                                        <td className="p-5 text-primary font-bold">
                                            {typeof row.gg === 'boolean' ? (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="size-4.5 text-emerald-500" />
                                                    <span className="text-emerald-600 dark:text-emerald-400">Full Support</span>
                                                </div>
                                            ) : (
                                                row.gg
                                            )}
                                        </td>
                                        <td className="p-5 text-slate-500 dark:text-slate-400">
                                            {typeof row.trad === 'boolean' ? (
                                                row.trad ? (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="size-4.5 text-slate-400" />
                                                        <span>Standard</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <X className="size-4 text-red-400" />
                                                        <span className="text-red-500/80">No Support</span>
                                                    </div>
                                                )
                                            ) : (
                                                row.trad
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SUPPORTED VEHICLES SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 scroll-mt-24" id="supported-vehicles">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.supportedVehicles.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.supportedVehicles.subtitle}</p>
                    </div>

                    <SupportedVehiclesSelector 
                        locale={locale} 
                        translations={copy.supportedVehicles} 
                    />
                </div>
            </section>

            {/* SOFTWARE LICENSES SECTION */}
            <section className="py-20 bg-[#F7F9FC] dark:bg-[#060D22] border-b border-slate-200 dark:border-slate-850 scroll-mt-24" id="software-licenses">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.licenses.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.licenses.subtitle}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-4 relative">
                        {copy.licenses.steps.map((step, idx) => (
                            <div 
                                key={idx} 
                                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 relative z-10"
                            >
                                <span className="absolute -top-3 left-6 rounded-md bg-[#0E1E4B] px-2.5 py-0.5 text-xs font-mono font-bold text-white dark:bg-primary">
                                    0{idx + 1}
                                </span>
                                <h3 className="mt-3 text-base font-bold text-[#0E1E4B] dark:text-white">{step.title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* REMOTE DIAGNOSTICS SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 scroll-mt-24" id="remote-diagnostics">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.remoteDiag.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.remoteDiag.subtitle}</p>
                    </div>

                    <RemoteDiagnosticsFlow steps={copy.remoteDiag.steps} />

                    <div className="mt-12 h-[200px] sm:h-[350px] md:h-[450px] lg:h-[500px]">
                        <ImagePlaceholder
                            name="Remote Diagnostics Workflow Diagram"
                            purpose="Visually explain the secure cloud connection linking the vehicle owner's tool, our server backend, and the partner mechanics."
                            prompt="Clean, minimalist isometric technical flow diagram demonstrating secure remote car diagnostics. On the left: a car connected via OBD-II adapter with an antenna wave icon. Center: a blue cloud server database icon marked with a shield check. Right: a workshop desktop station with diagnostic monitors showing dials. High contrast, clean vector style, white background."
                            aspectRatio="16:9"
                            placement="Full width illustration block underneath the interactive steps."
                            iconType="diagram"
                            src="/Remote-Diagnostics-Flow-Diagram.png"
                        />
                    </div>
                </div>
            </section>

            {/* APP ECOSYSTEM SECTION */}
            <section className="py-20 bg-[#F7F9FC] dark:bg-[#060D22] border-b border-slate-200 dark:border-slate-855">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.appEcosystem.title}</h2>
                            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-350">
                                {copy.appEcosystem.subtitle}
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {copy.appEcosystem.platforms.map((platform, idx) => (
                                    <div 
                                        key={platform} 
                                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                                            {idx === 0 && <Smartphone className="size-4" />}
                                            {idx === 1 && <Smartphone className="size-4 text-emerald-500" />}
                                            {idx === 2 && <Laptop className="size-4 text-primary" />}
                                            {idx === 3 && <Laptop className="size-4" />}
                                        </div>
                                        <span className="text-xs font-bold text-[#0E1E4B] dark:text-white">{platform}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* App Ecosystem Mockup Image Placeholder */}
                        <div className="h-[300px]">
                            <ImagePlaceholder
                                name="App Ecosystem Device Mockups"
                                purpose="Showcase unified GlobeGuard diagnostic app UI across smartphone, tablet, and desktop dashboards."
                                prompt="High fidelity digital mockups of GlobeGuard diagnostic client applications on three aligned screens: an iPhone 15 displaying a real-time dial interface, an iPad showing system fault logs, and a clean modern laptop running a dual-monitor professional dashboard. High-contrast colors, isolated on light grey flat background."
                                aspectRatio="4:3"
                                placement="Right side of App Ecosystem layout."
                                iconType="mockup"
                                src="/App-Ecosystem-Device-Mockups.png"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* INDUSTRIES SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.industries.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.industries.subtitle}</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {copy.industries.cards.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                                    {idx === 0 && <Car className="size-5" />}
                                    {idx === 1 && <Building2 className="size-5" />}
                                    {idx === 2 && <Compass className="size-5" />}
                                    {idx === 3 && <HardDrive className="size-5" />}
                                    {idx === 4 && <Truck className="size-5" />}
                                    {idx === 5 && <Store className="size-5" />}
                                </div>
                                <h3 className="text-base font-bold text-[#0E1E4B] dark:text-white">{item.title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GLOBEGUARD ELITE (B2B) SECTION */}
            <section className="py-20 bg-slate-50 text-slate-900 border-b border-slate-200 scroll-mt-24 dark:bg-[#0E1E4B] dark:text-white dark:border-slate-850" id="elite">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div className="space-y-6">
                            <span className="rounded bg-primary px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-white">
                                Commercial B2B Solutions
                            </span>
                            <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.elite.title}</h2>
                            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {copy.elite.desc}
                            </p>
                            <ul className="space-y-3 pt-2">
                                {copy.elite.features.map(f => (
                                    <li key={f} className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        <CheckCircle2 className="mr-3 size-4.5 text-primary shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-4">
                                <Link 
                                    href="/contact" 
                                    className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90"
                                >
                                    {copy.elite.cta}
                                </Link>
                            </div>
                        </div>

                        {/* B2B Dashboard Mockup Image Placeholder */}
                        <div className="h-[320px]">
                            <ImagePlaceholder
                                name="Elite B2B Workspace Mockup"
                                purpose="Showcase the enterprise fleet administration and workshop diagnostic dashboard."
                                prompt="Digital render of a modern enterprise SaaS dashboard for automotive workshops. Displays a fleet health breakdown map, active diagnostic tickets list, live technician location markers, and data charts. Sleek dark mode design. Clean, sharp vector shapes, isolated flat surface."
                                aspectRatio="16:9"
                                placement="Right side of B2B section layout."
                                iconType="elite"
                                src="/Elite-B2B-Workspace-Mockup.png"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950 border-b border-slate-250 dark:border-slate-800">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.testimonials.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.testimonials.subtitle}</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {copy.testimonials.list.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/30"
                            >
                                <div className="mb-4 text-primary">
                                    <MessageSquare className="size-6 text-primary fill-primary/10" />
                                </div>
                                <p className="text-sm italic leading-relaxed text-slate-650 dark:text-slate-300 flex-1">
                                    "{item.quote}"
                                </p>
                                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <div className="text-sm font-bold text-[#0E1E4B] dark:text-white">{item.author}</div>
                                    <div className="text-xs text-slate-400">{item.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-20 bg-[#F7F9FC] dark:bg-[#060D22] border-b border-slate-200 dark:border-slate-850">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">{copy.faq.title}</h2>
                        <p className="mt-4 text-base text-slate-500 dark:text-slate-400">{copy.faq.subtitle}</p>
                    </div>

                    <FAQAccordionSection list={copy.faq.list} />
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="py-20 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-4 lg:px-8 text-center">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-10 dark:border-slate-800 dark:bg-slate-900/30 lg:p-14">
                        <h2 className="text-3xl font-extrabold text-[#0E1E4B] dark:text-white sm:text-4xl">
                            {copy.finalCta.title}
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-base text-slate-650 dark:text-slate-350">
                            {copy.finalCta.subtitle}
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <Link 
                                href="/search" 
                                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/95 hover:-translate-y-[2px]"
                            >
                                {copy.finalCta.ctaShop}
                            </Link>
                            <Link 
                                href="/contact" 
                                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-bold text-[#0E1E4B] shadow-sm transition-all hover:bg-slate-50 hover:-translate-y-[2px] dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                            >
                                {copy.finalCta.ctaContact}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
