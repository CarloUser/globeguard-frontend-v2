import {expect, test} from '@playwright/test';
import {readMoney, switchLanguage} from './helpers';

/** Home page (German at the root): hero, the three B2C tier cards and the footer. */
test.describe('home page', () => {
    test('renders the hero, the tier cards with live "ab CHF" prices and the legal footer links', async ({page}) => {
        await page.goto('/');

        await expect(page.getByRole('heading', {level: 1, name: 'Lösungen für Reisemobile, Fernreisende und Werkstätten'})).toBeVisible();
        await expect(page.getByRole('link', {name: 'Fahrzeug prüfen'})).toBeVisible();
        await expect(page.getByRole('link', {name: 'Geräte entdecken'})).toBeVisible();

        // `priceFrom` is the live catalogue minimum NET variant price of the tier, the same
        // number `getTierMinPrices()` reads from the shop API (verified against
        // http://localhost:3000/shop-api: BASIC 583.00, WOMO 848.00, PRO 790.00).
        const tiers = [
            {name: 'GlobeGuard BASIC', cta: 'BASIC konfigurieren', href: '/produkte/basic', priceFrom: 583},
            {name: 'GlobeGuard WoMo', cta: 'Zu WoMo', href: '/produkte/womo', priceFrom: 848},
            {name: 'GlobeGuard PRO', cta: 'PRO konfigurieren', href: '/produkte/pro', priceFrom: 790},
        ];

        for (const tier of tiers) {
            const card = page.getByRole('article').filter({has: page.getByRole('heading', {level: 2, name: tier.name})});
            await expect(card).toBeVisible();

            const cardText = await card.innerText();
            expect(cardText).toContain('ab');
            expect(cardText).toContain('zzgl. MwSt.');

            // Anchor on "CHF", not on "ab": every tier description already contains
            // "ab Modelljahr ..." long before the "ab CHF ..." teaser line, so slicing at the
            // first "ab" never reaches the amount. readMoney() tolerates the Swiss thousands
            // apostrophe and the non-breaking space Intl puts after the currency code.
            const amountIndex = cardText.indexOf('CHF');
            expect(amountIndex).toBeGreaterThanOrEqual(0);
            expect(readMoney(cardText.slice(amountIndex))).toBe(tier.priceFrom);

            await expect(card.getByRole('link', {name: tier.cta})).toHaveAttribute('href', tier.href);
        }

        const footer = page.getByRole('contentinfo');
        const legalLinks = [
            {name: 'Impressum', href: '/impressum'},
            {name: 'AGB', href: '/agb'},
            {name: 'Datenschutz', href: '/datenschutz'},
            {name: 'Widerrufsrecht', href: '/widerruf'},
            {name: 'Zahlungsarten', href: '/zahlungsarten'},
            {name: 'Versand & Lieferung', href: '/versand'},
        ];

        for (const link of legalLinks) {
            await expect(footer.getByRole('link', {name: link.name, exact: true})).toHaveAttribute('href', link.href);
        }

        await expect(footer).toContainText('GlobeGuard GmbH');
        await expect(footer).toContainText('Untermühlestrasse 12');
    });

    test('the language picker switches to /en and back without losing the path', async ({page}) => {
        await page.goto('/produkte/basic');
        await expect(page.getByRole('heading', {level: 1})).toBeVisible();

        await switchLanguage(page, 'English', /\/en\/produkte\/basic$/);
        await expect(page.getByRole('button', {name: 'Switch language'})).toContainText('English');
        const mainNav = page.getByRole('navigation', {name: /Main navigation|Hauptnavigation/});
        await expect(mainNav.getByRole('link', {name: 'Why GlobeGuard?'})).toBeVisible();

        await switchLanguage(page, 'Deutsch', /localhost:\d+\/produkte\/basic$/);
        await expect(page.getByRole('button', {name: 'Sprache wechseln'})).toContainText('Deutsch');
        await expect(mainNav.getByRole('link', {name: 'Warum GlobeGuard?'})).toBeVisible();
    });
});
