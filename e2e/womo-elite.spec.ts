import {expect, test} from '@playwright/test';
import {addOnSummary, cartToast, expectLiveTotal} from './helpers';

/** WoMo device: the Truma adapter cable set is pre-ticked and can be removed. */
test('WoMo Ford prompts for the Truma cable set and warns when it is removed', async ({page}) => {
    await page.goto('/products/gg-basic-womo-ford?year=2019');

    await expect(page.getByRole('heading', {level: 1, name: 'GlobeGuard WoMo – Ford'})).toBeVisible();

    const truma = page.getByRole('checkbox', {name: /Truma-Adapterkabel-Set mitbestellen/});
    await expect(truma).toHaveAttribute('aria-checked', 'true');
    await expect(addOnSummary(page)).toContainText('Adapterkabel-Set Truma Combi');

    // 848 device + 90 cable set
    await expectLiveTotal(page, 938);

    await truma.click();
    await expect(truma).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('Ohne Adapterkabel-Set ist keine Truma-Diagnose möglich.')).toBeVisible();
    await expectLiveTotal(page, 848);
});

/**
 * ELITE Cars Mixed: 4-10 brand groups, add-to-cart is blocked below the minimum.
 *
 * ELITE Cars Mixed is deliberately NOT an "ELITE device" in the domain model
 * (`isEliteDeviceProduct` excludes it), so it offers no SGW multi-select and therefore
 * never raises the `elite-no-sgw` confirmation. That dialog belongs to the real ELITE
 * devices and is covered by the ELITE Cars Multibrand test below.
 */
test('ELITE Cars Mixed blocks below four brand groups and stores the selection on the cart line', async ({page}) => {
    test.setTimeout(120_000);

    await page.goto('/products/gg-elite-cars-mx');

    const grid = page.getByRole('group', {name: 'Markengruppen'});
    await expect(grid).toBeVisible();
    await expect(page.getByText('Markengruppen wählen (0/10, mindestens 4)')).toBeVisible();

    for (const brand of ['Bentley', 'BMW, Mini', 'Bugatti']) {
        await grid.getByRole('checkbox', {name: brand, exact: true}).click();
    }
    await expect(page.getByText('Markengruppen wählen (3/10, mindestens 4)')).toBeVisible();
    await expect(page.getByText('Bitte wählen Sie mindestens 4 Markengruppen, um fortzufahren.')).toBeVisible();

    await page.getByRole('button', {name: 'In den Warenkorb'}).click();
    await expect(cartToast(page, 'Bitte wählen Sie zuerst mindestens 4 Markengruppen aus.')).toBeVisible({timeout: 20_000});

    // The blocking warning must leave the cart untouched. Asserting that the success toast is
    // absent would also pass while it simply had not rendered yet, so assert the observable
    // end state instead: the cart page still shows its empty state.
    await page.goto('/cart');
    await expect(page.getByRole('heading', {level: 2, name: 'Ihr Warenkorb ist leer'})).toBeVisible({timeout: 30_000});

    // Back to the configurator. A fresh load drops the client-side selection, so the three
    // groups are picked again together with the fourth that lifts the block.
    await page.goto('/products/gg-elite-cars-mx');
    await expect(grid).toBeVisible();
    for (const brand of ['Bentley', 'BMW, Mini', 'Bugatti', 'Buick']) {
        await grid.getByRole('checkbox', {name: brand, exact: true}).click();
    }
    await expect(page.getByText('Markengruppen wählen (4/10, mindestens 4)')).toBeVisible();
    await expect(page.getByText('Bitte wählen Sie mindestens 4 Markengruppen, um fortzufahren.')).toHaveCount(0);

    await page.getByRole('button', {name: 'In den Warenkorb'}).click();
    await expect(cartToast(page, 'Warenkorb gelegt')).toBeVisible({timeout: 30_000});

    await page.goto('/cart');
    await expect(page.getByText('Zwischensumme (netto)')).toBeVisible({timeout: 30_000});
    await expect(page.getByRole('link', {name: 'GlobeGuard ELITE – Cars Mixed (4–10)'}).first()).toBeVisible();
    await expect(page.getByText('4 Markengruppen gewählt')).toBeVisible();
    await expect(page.getByText('GG-ELITE-CARS-MX')).toBeVisible();
});

/** A real ELITE device asks for confirmation when no SGW unlock was picked. */
test('ELITE Cars Multibrand confirms an order without any SGW unlock', async ({page}) => {
    test.setTimeout(120_000);

    await page.goto('/products/gg-elite-cars-mb');

    await expect(page.getByText('SGW-Freischaltungen (optional, beliebig viele)')).toBeVisible();
    await expect(page.getByRole('checkbox', {name: 'SGW-Lizenz Fiat/Stellantis'})).toHaveAttribute('aria-checked', 'false');

    await page.getByRole('button', {name: 'In den Warenkorb'}).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Keine SGW-Freischaltung gewählt');
    await dialog.getByRole('button', {name: 'Ohne Freischaltung fortfahren'}).click();

    await expect(cartToast(page, 'Warenkorb gelegt')).toBeVisible({timeout: 30_000});
});
