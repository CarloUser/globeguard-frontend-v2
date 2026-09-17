/**
 * Short "most desirable features" bullets for the product page. Only DEVICE
 * products get a list — accessories, updates, licenses etc. return [] and the
 * section stays hidden (deliberately sparse, owner decision 2026-07-07).
 *
 * Factual guardrails: bullets derive from the documented feature set per
 * vehicle class; pure-EV brands (evOnly in brand-compatibility.json) never
 * see DPF/AdBlue/injector claims; motorcycles never see DPF/AdBlue.
 *
 * Ported 1:1 from the previous storefront (src/services/product-highlights.ts).
 * The DE/EN sentences are business data kept here with stable keys so the UI
 * can either render `text` directly or translate by `key`.
 */
import brandUseCases from '@/data/brand-use-cases.json';

import { ALL_BRAND_GROUPS } from './picker';
import { vehicleTypeFromSku } from './vehicle-type';

const DEVICE_TIERS = ['BASIC', 'WOMO', 'PRO'];

export interface IHighlightProduct {
    sku?: string | null;
    tierKey?: string | null;
    brandGroupId?: string | null;
}

export type HighlightKey =
    | 'readClearAll'
    | 'allClasses'
    | 'dpfAdblue'
    | 'absMaintenance'
    | 'airBrakeTacho'
    | 'trumaUnlock'
    | 'codingCalibration'
    | 'injectorCoding'
    | 'liveData'
    | 'remoteDiagnostics';

export const HIGHLIGHT_BULLETS: Record<HighlightKey, { de: string; en: string }> = {
    readClearAll: {
        de: 'Fehler ALLER Steuergeräte lesen & löschen – Klartext wie am Marken-Tester',
        en: 'Read & clear faults on ALL control units – plain-text like the OEM tester',
    },
    allClasses: {
        de: 'Alle Klassen auf einem Gerät: PKW/VAN, LKW, Trailer & Bus',
        en: 'All classes on one device: car/van, truck, trailer & bus',
    },
    dpfAdblue: {
        de: 'DPF-/GPF-Regeneration & AdBlue-Wartung – ohne Werkstatt-Termin',
        en: 'DPF/GPF regeneration & AdBlue service – no dealer visit needed',
    },
    absMaintenance: {
        de: 'ABS-Wartungsfunktionen: Entlüften, Befüllen, Prüfen',
        en: 'ABS maintenance: bleeding, filling, testing',
    },
    airBrakeTacho: {
        de: 'Druckluftbremse ansteuern & Tachograph-Parameter',
        en: 'Air-brake actuation & tachograph parameters',
    },
    trumaUnlock: {
        de: 'Truma-Diagnose: verriegelte Heizung selbst entsperren',
        en: 'Truma diagnostics: unlock a locked heater yourself',
    },
    codingCalibration: {
        de: 'Codieren & Kalibrieren von Sensoren und intelligenten Komponenten',
        en: 'Coding & calibration of sensors and intelligent components',
    },
    injectorCoding: {
        de: 'Injektor-Codierung, Sensor-Kalibrierung & Komponenten anlernen',
        en: 'Injector coding, sensor calibration & component teach-in',
    },
    liveData: {
        de: 'Live-Daten mit Aufzeichnung, Panel- und Diagramm-Ansicht',
        en: 'Live data with logging, panel and chart view',
    },
    remoteDiagnostics: {
        de: 'Ferndiagnose weltweit – im 1. Jahr inklusive',
        en: 'Worldwide remote diagnostics – 1st year included',
    },
};

/** One highlight bullet: generic bullets carry a `HighlightKey`, brand bullets `brand:<groupId>:<n>`. */
export interface ProductHighlight {
    key: string;
    text: string;
}

function isDeviceTier(tierKey: string): boolean {
    return DEVICE_TIERS.includes(tierKey) || tierKey.startsWith('ELITE');
}

const USE_CASES = brandUseCases as Record<string, { de: string; en: string }>;

/**
 * Brand-specific bullets, parsed from the researched use-case sentence
 * ("Typische Einsatzgebiete bei X: a, b, c." → [A, B, C]). These are the
 * HIGH-PRIORITY items for owners of that brand (e.g. INEOS: service reset,
 * transport-mode deactivation, battery registration) and lead the list.
 */
function brandBullets(brandGroupId: string | null | undefined, en: boolean): string[] {
    const entry = brandGroupId ? USE_CASES[brandGroupId] : null;
    if (!entry) return [];

    const sentence = en ? entry.en : entry.de;
    const colonIndex = sentence.indexOf(':');
    if (colonIndex === -1) return [];

    return sentence
        .slice(colonIndex + 1)
        .replace(/\.\s*$/, '')
        .split(', ')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .slice(0, 3);
}

/** Keywords that mark a generic bullet as redundant next to a brand bullet. */
const OVERLAP_KEYWORDS = ['dpf', 'adblue', 'injektor', 'injector', 'batterie', 'battery', 'service'];

function overlapsBrandBullets(genericBullet: string, brand: string[]): boolean {
    const generic = genericBullet.toLowerCase();
    return OVERLAP_KEYWORDS.some((keyword) => generic.includes(keyword)
        && brand.some((bullet) => bullet.toLowerCase().includes(keyword)));
}

export function getProductHighlightItems(product: IHighlightProduct, locale?: string | null): ProductHighlight[] {
    const tierKey = String(product.tierKey || '');

    if (!isDeviceTier(tierKey)) {
        return [];
    }

    const en = String(locale ?? '').toLowerCase().startsWith('en');
    const type = vehicleTypeFromSku(product.sku) || 'car';
    const evOnly = Boolean(product.brandGroupId
        && ALL_BRAND_GROUPS.find((group) => group.id === product.brandGroupId)?.evOnly);
    const moto = type === 'moto';
    const truckish = type === 'truck' || type === 'bus' || type === 'trailer';
    const combustion = !evOnly && !moto;

    // Brand-priority bullets lead the list (e.g. INEOS: service reset,
    // transport-mode deactivation, battery registration).
    const brandTexts = brandBullets(product.brandGroupId, en);
    const brand: ProductHighlight[] = brandTexts.map((text, index) => ({
        key: `brand:${product.brandGroupId}:${index}`,
        text,
    }));
    const bullets: ProductHighlight[] = [];
    const push = (key: HighlightKey) => {
        bullets.push({ key, text: en ? HIGHLIGHT_BULLETS[key].en : HIGHLIGHT_BULLETS[key].de });
    };

    push('readClearAll');

    if (type === 'all') {
        push('allClasses');
    }

    if (combustion) {
        push('dpfAdblue');
    }

    if (moto) {
        push('absMaintenance');
    }

    if (truckish) {
        push('airBrakeTacho');
    }

    if (type === 'womo') {
        push('trumaUnlock');
    }

    push(evOnly ? 'codingCalibration' : 'injectorCoding');

    push('liveData');

    push('remoteDiagnostics');

    // Brand bullets first; generic bullets that repeat a brand topic
    // (DPF, battery, service …) are dropped instead of shown twice.
    const generic = bullets.filter((bullet) => !overlapsBrandBullets(bullet.text, brandTexts));

    return [...brand, ...generic].slice(0, brand.length > 0 ? 7 : 6);
}

/** Same as getProductHighlightItems, texts only (previous storefront signature). */
export function getProductHighlights(product: IHighlightProduct, locale?: string | null): string[] {
    return getProductHighlightItems(product, locale).map((highlight) => highlight.text);
}
