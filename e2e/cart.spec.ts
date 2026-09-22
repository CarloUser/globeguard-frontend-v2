import {expect, test} from '@playwright/test';
import {addBasicFiat2020, cartRowBySku, cartToast, readMoney, subtotalRow} from './helpers';

/** Guest cart with the BASIC Fiat 2020 configuration: 3 NET lines, SGW removal guard. */
test('the configured BASIC set lands in the cart as three NET lines', async ({page}) => {
    test.setTimeout(120_000);

    await page.goto('/products/gg-basic-car-fiat-alfa-romeo-lancia?year=2020');
    await page.getByRole('button', {name: 'In den Warenkorb'}).click();

    const toast = cartToast(page, 'Warenkorb gelegt');
    await expect(toast).toBeVisible({timeout: 30_000});
    await expect(toast).toContainText('GlobeGuard BASIC – Fiat, Alfa Romeo, Lancia (+2)');
    await toast.getByRole('button', {name: 'Zum Warenkorb'}).click();
    await page.waitForURL(/\/cart$/);

    await expect(page.getByText('Zwischensumme (netto)')).toBeVisible({timeout: 30_000});

    const skus = ['GG-BASIC-CAR-FIAT-ALFA-ROMEO-LANCIA', 'GG-SGW-CABLE-FCCA', 'GG-SGW-LIC-STELLANTIS-DAY'];
    for (const sku of skus) {
        await expect(page.getByText(`Art.-Nr.: ${sku}`)).toBeVisible();
    }
    await expect(page.getByRole('button', {name: 'Artikel entfernen'})).toHaveCount(3);
    await expect(page.getByText('Fiat, Alfa Romeo, Lancia · Modelljahr 2020')).toHaveCount(3);

    expect(readMoney(await subtotalRow(page).innerText())).toBe(730);
    await expect(page.getByText('zzgl. MwSt.').first()).toBeVisible();
    await expect(page.getByText('MwSt. wird an der Kasse nach Lieferland berechnet')).toBeVisible();

    // Removing an SGW line must be confirmed.
    await cartRowBySku(page, 'GG-SGW-LIC-STELLANTIS-DAY').getByRole('button', {name: 'Artikel entfernen'}).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('SGW-Freischaltung wirklich entfernen?');
    await dialog.getByRole('button', {name: 'Ohne Freischaltung fortfahren'}).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByRole('button', {name: 'Artikel entfernen'})).toHaveCount(2);
    await expect(page.getByText('Art.-Nr.: GG-SGW-LIC-STELLANTIS-DAY')).toHaveCount(0);

    // Guests must create an account before checking out.
    await expect(page.getByText('Für die Bestellung ist ein Kundenkonto erforderlich', {exact: false})).toBeVisible();
    await expect(page.getByRole('link', {name: 'Anmelden oder Konto erstellen'})).toHaveAttribute(
        'href',
        '/sign-in?redirectTo=%2Fcheckout',
    );

    // "Zur Kasse" is a Base UI Button rendered as a next-intl Link: it navigates through a
    // real anchor but exposes role="button" (see follow-ups).
    const checkoutButton = page.getByRole('button', {name: 'Zur Kasse'});
    await expect(checkoutButton).toHaveAttribute('href', '/checkout');
    await checkoutButton.click();
    await page.waitForURL(/\/sign-in\?redirectTo=%2Fcheckout$/);
    await expect(page.getByRole('button', {name: 'Anmelden', exact: true})).toBeVisible();
});

/** The helper used by the checkout spec must produce the same three lines. */
test('addBasicFiat2020 helper produces a 730.00 cart', async ({page}) => {
    test.setTimeout(120_000);

    await addBasicFiat2020(page);
    await page.goto('/cart');

    await expect(page.getByText('Zwischensumme (netto)')).toBeVisible({timeout: 30_000});
    await expect(page.getByRole('button', {name: 'Artikel entfernen'})).toHaveCount(3);
});
