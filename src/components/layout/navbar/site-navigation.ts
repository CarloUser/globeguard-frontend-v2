/**
 * Frozen public route map for the storefront navigation (see docs/DECISIONS.md, O1).
 * Labels are resolved through next-intl (`Navigation.<key>`); hrefs are locale-agnostic
 * and must be rendered through the next-intl `Link` helpers (or `NavigationLink`).
 */
export interface SiteNavItem {
    /** Message key inside the `Navigation` namespace. */
    key: string;
    /** Locale-agnostic pathname from the frozen route map. */
    href: string;
}

export const MAIN_NAV_ITEMS: readonly SiteNavItem[] = [
    {key: 'warumGlobeguard', href: '/warum-globeguard'},
    {key: 'basic', href: '/produkte/basic'},
    {key: 'pro', href: '/produkte/pro'},
    {key: 'elite', href: '/produkte/elite'},
    {key: 'zubehoer', href: '/produkte/kategorie/zubehoer'},
    {key: 'services', href: '/produkte/kategorie/services'},
    {key: 'updates', href: '/produkte/kategorie/software-updates'},
    {key: 'support', href: '/support'},
];

export const FOOTER_PRODUCT_LINKS: readonly SiteNavItem[] = [
    {key: 'basic', href: '/produkte/basic'},
    {key: 'pro', href: '/produkte/pro'},
    {key: 'elite', href: '/produkte/elite'},
    {key: 'zubehoer', href: '/produkte/kategorie/zubehoer'},
    {key: 'services', href: '/produkte/kategorie/services'},
    {key: 'updates', href: '/produkte/kategorie/software-updates'},
];

export const FOOTER_INFORMATION_LINKS: readonly SiteNavItem[] = [
    {key: 'warumGlobeguard', href: '/warum-globeguard'},
    {key: 'unterstuetzteMarken', href: '/unterstuetzte-marken'},
    {key: 'support', href: '/support'},
    {key: 'faq', href: '/faq'},
    {key: 'trackOrder', href: '/track-order'},
    {key: 'blog', href: '/blog'},
    {key: 'partner', href: '/partner'},
    {key: 'ueberUns', href: '/ueber-uns'},
];

export const FOOTER_LEGAL_LINKS: readonly SiteNavItem[] = [
    {key: 'impressum', href: '/impressum'},
    {key: 'agb', href: '/agb'},
    {key: 'datenschutz', href: '/datenschutz'},
    {key: 'widerruf', href: '/widerruf'},
    {key: 'zahlungsarten', href: '/zahlungsarten'},
    {key: 'versand', href: '/versand'},
];

export const ACCOUNT_NAV_ITEMS: readonly SiteNavItem[] = [
    {key: 'profile', href: '/account/profile'},
    {key: 'orders', href: '/account/orders'},
    {key: 'addresses', href: '/account/addresses'},
];

/** Shared styling of the mobile sheet entries (MobileNav links and the MobileNavAuth button). */
export const MOBILE_NAV_ITEM_CLASS =
    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary';
