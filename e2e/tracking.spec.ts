import {expect, test} from '@playwright/test';

/** /track-order: order code + e-mail lookup without an account. */
test.describe('order tracking', () => {
    test('an unknown order code reports "not found" without leaking which input was wrong', async ({page}) => {
        await page.goto('/track-order');

        await expect(page.getByRole('heading', {level: 1, name: 'Bestellung verfolgen'})).toBeVisible();

        await page.getByLabel('Bestellnummer').fill('GG000000');
        await page.getByLabel('E-Mail-Adresse').fill('nobody@globeguard-e2e.test');
        await page.getByRole('button', {name: 'Verfolgen'}).click();

        await expect(page.getByText('Keine Bestellung gefunden', {exact: true})).toBeVisible({timeout: 30_000});
        await expect(
            page.getByText(
                'Zu dieser Kombination aus Bestellnummer und E-Mail-Adresse wurde keine Bestellung gefunden. Bitte prüfen Sie Ihre Eingaben.',
            ),
        ).toBeVisible();
    });

    test('malformed input is rejected by the form before any request is sent', async ({page}) => {
        await page.goto('/track-order');

        // Empty form.
        await page.getByRole('button', {name: 'Verfolgen'}).click();
        await expect(page.getByText('Bestellnummer ist erforderlich')).toBeVisible();
        await expect(page.getByText('E-Mail-Adresse ist erforderlich')).toBeVisible();

        // Malformed e-mail.
        await page.getByLabel('Bestellnummer').fill('   GG000000   ');
        await page.getByLabel('E-Mail-Adresse').fill('not-an-email');
        await page.getByRole('button', {name: 'Verfolgen'}).click();
        await expect(page.getByText('Ungültige E-Mail-Adresse')).toBeVisible();
        await expect(page.getByText('Keine Bestellung gefunden', {exact: true})).toHaveCount(0);

        // A valid address is accepted again and the trimmed code is looked up.
        await page.getByLabel('E-Mail-Adresse').fill('nobody@globeguard-e2e.test');
        await page.getByRole('button', {name: 'Verfolgen'}).click();
        await expect(page.getByText('Keine Bestellung gefunden', {exact: true})).toBeVisible({timeout: 30_000});
    });
});
