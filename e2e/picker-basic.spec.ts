import {expect, test} from '@playwright/test';
import {addOnSummary, chooseSelectOption, chooseVariantOption, expectLiveTotal, variantOption} from './helpers';

/**
 * BASIC finder -> product page for a Fiat/Alfa/Lancia of model year 2020: that combination
 * needs the FCCA bypass cable (90.00) and a Stellantis SGW licence (20.00 per day) on top
 * of the 620.00 device.
 */
test.describe('BASIC picker and SGW configuration', () => {
    test('picks Auto / Fiat / 2020 and configures the Security Gateway add-ons', async ({page}) => {
        await page.goto('/produkte/basic');

        const picker = page.locator('main form');
        await picker.getByRole('button', {name: 'PKW & Van'}).click();
        await expect(picker.getByRole('button', {name: 'PKW & Van'})).toHaveAttribute('aria-pressed', 'true');

        await picker.getByLabel('Markengruppe', {exact: true}).selectOption({label: 'Fiat, Alfa Romeo, Lancia'});
        await picker.getByLabel('Modelljahr', {exact: true}).selectOption('2020');

        // The picker already warns about the Security Gateway requirement.
        await expect(picker.getByText('Security Gateway (SGW):')).toBeVisible();
        await expect(picker).toContainText('SGW-Bypass-Kabel (FCCA)');
        await expect(picker).toContainText('SGW-Lizenz Fiat/Stellantis');

        await picker.getByRole('button', {name: 'Zum Produkt'}).click();
        await page.waitForURL(/\/products\/gg-basic-car-fiat-alfa-romeo-lancia\?year=2020$/);

        await expect(page.getByRole('heading', {level: 1, name: 'GlobeGuard BASIC – Fiat, Alfa Romeo, Lancia'})).toBeVisible();
        await expect(page.getByText('✓ Kompatibel mit Modelljahr 2020')).toBeVisible();

        const sgwCheckbox = page.getByRole('checkbox', {name: /Security-Gateway-Freischaltung/});
        await expect(sgwCheckbox).toBeVisible();
        await expect(sgwCheckbox).toHaveAttribute('aria-checked', 'true');

        const summary = addOnSummary(page);
        await expect(summary).toContainText('SGW-Bypass-Kabel (FCCA)');
        await expect(summary).toContainText('SGW-Lizenz Fiat/Stellantis (1 Tag)');
        await expect(summary).toContainText('CHF 110.00');

        // 620 device + 90 cable + 20 day licence
        await expectLiveTotal(page, 730);

        // 620 + 90 + 90 (month licence)
        await chooseSelectOption(page, 'Lizenzdauer wählen', '1 Monat – CHF 90.00');
        await expectLiveTotal(page, 800);

        // 620 + 90 + 2 x 90
        await chooseSelectOption(page, 'Anzahl wählen', '2 Stück');
        await expectLiveTotal(page, 890);
        await expect(summary).toContainText('2× SGW-Lizenz Fiat/Stellantis (1 Monat)');

        // Unticking the unlock must be confirmed first.
        await sgwCheckbox.click();
        const dialog = page.getByRole('alertdialog');
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText('SGW-Freischaltung wirklich entfernen?');
        await dialog.getByRole('button', {name: 'Ohne Freischaltung fortfahren'}).click();
        await expect(dialog).toBeHidden();

        await expect(sgwCheckbox).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByText('Achtung: Ohne SGW-Freischaltung sind Diagnosefunktionen bei diesem Fahrzeug stark eingeschränkt.')).toBeVisible();
        await expect(summary).toHaveCount(0);
        await expectLiveTotal(page, 620);

        // Re-ticking brings the licence section (and the previous selection) back.
        await sgwCheckbox.click();
        await expect(sgwCheckbox).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByRole('combobox', {name: 'Lizenzdauer wählen'})).toBeVisible();
        await expect(page.getByText('Achtung: Ohne SGW-Freischaltung sind Diagnosefunktionen bei diesem Fahrzeug stark eingeschränkt.')).toHaveCount(0);
        await expectLiveTotal(page, 890);
    });

    test('the standalone Stellantis licence product offers the Dauer variant selector', async ({page}) => {
        await page.goto('/products/gg-sgw-lic-stellantis');

        await expect(page.getByRole('heading', {level: 1, name: /Stellantis/})).toBeVisible();
        for (const duration of ['1 Tag', '1 Woche', '1 Monat', '1 Jahr']) {
            await expect(variantOption(page, duration)).toBeVisible();
            await expect(page.getByRole('radio', {name: duration, exact: true})).toBeAttached();
        }

        await chooseVariantOption(page, '1 Tag');
        await expectLiveTotal(page, 20);

        await chooseVariantOption(page, '1 Jahr');
        await expect(page.getByRole('radio', {name: '1 Jahr', exact: true})).toHaveAttribute('aria-checked', 'true');
        await expectLiveTotal(page, 370);
    });
});
