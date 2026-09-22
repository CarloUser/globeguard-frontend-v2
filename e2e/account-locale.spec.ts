import {expect, test} from '@playwright/test';
import {newTestCustomer, registerAndVerify, switchLanguage} from './helpers';

/** Account area of a freshly verified customer, in both locales. */
test('a signed-in customer sees the empty order list and the profile, in German and English', async ({page}) => {
    test.setTimeout(240_000);

    const customer = await registerAndVerify(page, newTestCustomer('account'));

    await page.goto('/account/orders');
    await expect(page.getByRole('heading', {level: 1, name: 'Meine Bestellungen'})).toBeVisible();
    await expect(page.getByText('Sie haben noch keine Bestellungen aufgegeben.')).toBeVisible({timeout: 30_000});

    await page.goto('/account/profile');
    await expect(page.getByRole('heading', {level: 1, name: 'Profil'})).toBeVisible();
    await expect(page.getByText('Verwalten Sie Ihre Kontoinformationen')).toBeVisible();
    await expect(page.getByLabel('Vorname')).toHaveValue(customer.firstName);
    await expect(page.getByLabel('Nachname')).toHaveValue(customer.lastName);

    await page.goto('/en/account/orders');
    await expect(page.getByRole('heading', {level: 1, name: 'My Orders'})).toBeVisible();
    await expect(page.getByText("You haven't placed any orders yet.")).toBeVisible({timeout: 30_000});
});

/** The language picker keeps the pathname and the picker query string. */
test('switching the language on a configured product page keeps path and query', async ({page}) => {
    await page.goto('/products/gg-basic-car-fiat-alfa-romeo-lancia?year=2020');
    await expect(page.getByText('✓ Kompatibel mit Modelljahr 2020')).toBeVisible();

    await switchLanguage(page, 'English', /\/en\/products\/gg-basic-car-fiat-alfa-romeo-lancia\?year=2020$/);
    await expect(page.getByText('✓ Compatible with model year 2020')).toBeVisible();

    await switchLanguage(page, 'Deutsch', /localhost:\d+\/products\/gg-basic-car-fiat-alfa-romeo-lancia\?year=2020$/);
    await expect(page.getByText('✓ Kompatibel mit Modelljahr 2020')).toBeVisible();
});
