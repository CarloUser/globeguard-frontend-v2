/**
 * Verified company facts for GlobeGuard GmbH.
 *
 * Keep this object small and factual. Marketing copy, navigation labels and
 * product descriptions belong in the next-intl message files or the catalogue,
 * not here. Phone number and business hours are intentionally omitted until
 * they are confirmed by the owner.
 */
export const globeguardCompany = {
    name: 'GlobeGuard GmbH',
    address: {
        street: 'Untermühlestrasse 12',
        postalCode: '6330',
        city: 'Cham',
        country: 'Schweiz',
    },
    addressLine: 'Untermühlestrasse 12, 6330 Cham, Schweiz',
    email: 'info@globeguard.ch',
    vat: 'CHE-184.027.784',
    tagline: 'Lösungen für Reisemobile, Fernreisende und Werkstätten',
} as const;

export type GlobeguardCompany = typeof globeguardCompany;
