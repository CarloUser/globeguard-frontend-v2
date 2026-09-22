import {expect, test} from '@playwright/test';
import {addOnSummary, expectLiveTotal} from './helpers';

/**
 * PRO finder with an extra brand slot: VW Gruppe 2020 (needs the VAG SGW licence) plus
 * BMW/Mini 2021 as "Zusatzmarke 2" (a PRO Erweiterung at 320.00, no SGW needed).
 */
test('PRO picker carries the extra brand into the product page and prices it', async ({page}) => {
    await page.goto('/produkte/pro');

    const picker = page.locator('main form');
    await picker.getByRole('button', {name: 'PKW & Van'}).click();
    await picker.getByLabel('Markengruppe', {exact: true}).selectOption({label: 'VW Gruppe (Audi; Cupra, Seat, Skoda, Volkswagen)'});
    await picker.getByLabel('Modelljahr', {exact: true}).selectOption('2020');

    await picker.getByLabel('Zusatzmarke 2 (optional)').selectOption('cars-vans-bmw-mini');
    await picker.locator('#gg-extra-year-0').selectOption('2021');

    await picker.getByRole('button', {name: 'Zum Produkt'}).click();
    await page.waitForURL(/\/products\/gg-pro-car-vw-gruppe-audi-cupra-seat-skoda-volkswagen\?/);

    const params = new URL(page.url()).searchParams;
    expect(params.get('year')).toBe('2020');
    expect(params.get('extraBrands')).toBe('cars-vans-bmw-mini:2021');

    // Main brand: VW Gruppe from 2020 needs the VAG licence (no bypass cable).
    const sgwCheckbox = page.getByRole('checkbox', {name: /Security-Gateway-Freischaltung/});
    await expect(sgwCheckbox).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('SGW-Lizenz VW-Gruppe', {exact: false}).first()).toBeVisible();

    // Extra brand row for the second slot.
    const extras = page.locator('p', {hasText: 'Zusatzmarken (PRO Erweiterung) – werden mit in den Warenkorb gelegt:'});
    await expect(extras).toBeVisible();
    const extraRow = page.getByRole('listitem').filter({hasText: 'BMW, Mini'});
    await expect(extraRow).toContainText('(Modelljahr 2021)');

    const summary = addOnSummary(page);
    await expect(summary).toContainText('SGW-Lizenz VW-Gruppe (1 Tag)');
    await expect(summary).toContainText('PRO Erweiterung – BMW, Mini');
    // 320.00 extension + 20.00 day licence
    await expect(summary).toContainText('CHF 340.00');

    // 820 device + 320 extension + 20 licence
    await expectLiveTotal(page, 1160);
    await expect(page.getByText('Gerät CHF 820.00 + Optionen CHF 340.00')).toBeVisible();
});
