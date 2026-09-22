import {expect, test} from '@playwright/test';
import {
    addBasicFiat2020,
    fillCheckoutAddressDialog,
    newTestCustomer,
    readMoney,
    registerAndVerify,
    subtotalRow,
} from './helpers';

/**
 * Checkout for a freshly registered + verified private customer.
 *
 * Without a Mollie API key the backend reports no eligible payment method for a private
 * customer (the invoice method is restricted to approved business customers), so the
 * payment step must show the translated explanation instead of an empty list. Placing an
 * order is therefore not reachable locally.
 */
test('German checkout: address, Swiss delivery methods and the no-payment-method notice', async ({page}) => {
    test.setTimeout(240_000);

    await registerAndVerify(page, newTestCustomer('checkout-de'));
    await addBasicFiat2020(page);

    await page.goto('/checkout');
    await fillCheckoutAddressDialog(page, 'de');

    // Saved address: Switzerland is the default country of the form.
    const addressStep = page.getByRole('region', {name: /Lieferadresse/});
    await expect(addressStep).toContainText('Untermühlestrasse 12');
    await expect(addressStep).toContainText('6330 Cham');
    await expect(addressStep).toContainText('Schweiz');
    await expect(addressStep.getByRole('checkbox', {name: 'Gleiche Adresse für Rechnungsstellung verwenden'})).toHaveAttribute(
        'aria-checked',
        'true',
    );
    await addressStep.getByRole('button', {name: 'Mit ausgewählter Adresse fortfahren'}).click();

    // Delivery: Swiss Post methods plus pickup in Cham.
    const deliveryStep = page.getByRole('region', {name: /Liefermethode/});
    await expect(deliveryStep.getByRole('heading', {name: 'Versandart wählen'})).toBeVisible({timeout: 30_000});
    for (const method of ['Schweizer Post Priority', 'Schweizer Post Economy', 'Selbstabholung Cham', 'EU Versand (mit Tracking)']) {
        await expect(deliveryStep.getByText(method, {exact: true})).toBeVisible();
    }

    const priority = deliveryStep.getByRole('radio', {name: /Schweizer Post Priority/});
    await priority.click();
    await expect(priority).toHaveAttribute('aria-checked', 'true');
    await deliveryStep.getByRole('button', {name: 'Weiter zur Zahlung'}).click();

    // Payment: no Mollie key locally and no invoice tile for a private customer.
    const paymentStep = page.getByRole('region', {name: /Zahlungsmethode/});
    await expect(paymentStep.getByText('Zurzeit ist keine Zahlungsart verfügbar')).toBeVisible({timeout: 30_000});
    await expect(paymentStep).toContainText('Privatkunden bezahlen online');
    await expect(paymentStep).toContainText('Kauf auf Rechnung steht nur freigeschalteten Geschäftskunden zur Verfügung.');
    await expect(paymentStep.getByRole('link', {name: 'Kontakt aufnehmen'})).toBeVisible();
    await expect(paymentStep.getByRole('radio')).toHaveCount(0);
    await expect(paymentStep.getByText('Rechnung', {exact: true})).toHaveCount(0);

    // Order summary stays NET.
    expect(readMoney(await subtotalRow(page, 'de').innerText())).toBe(730);
    await expect(page.getByText('zzgl. MwSt.').first()).toBeVisible();
});

test('English checkout shows the same steps with English labels', async ({page}) => {
    test.setTimeout(240_000);

    await registerAndVerify(page, newTestCustomer('checkout-en'));
    await addBasicFiat2020(page);

    // The "add shipping address" dialog opens by itself for a customer without addresses,
    // so the page heading behind it is not in the accessibility tree yet.
    await page.goto('/en/checkout');
    await fillCheckoutAddressDialog(page, 'en');
    await expect(page.getByRole('heading', {level: 1, name: 'Checkout'})).toBeVisible({timeout: 30_000});

    const addressStep = page.getByRole('region', {name: /Shipping Address/});
    await expect(addressStep).toContainText('Untermühlestrasse 12');
    await expect(addressStep).toContainText('Switzerland');
    await addressStep.getByRole('button', {name: 'Continue with selected address'}).click();

    const deliveryStep = page.getByRole('region', {name: /Delivery Method/});
    await expect(deliveryStep.getByRole('heading', {name: 'Select shipping method'})).toBeVisible({timeout: 30_000});
    await expect(deliveryStep.getByText('Swiss Post Priority', {exact: true})).toBeVisible();

    const priority = deliveryStep.getByRole('radio', {name: /Swiss Post Priority/});
    await priority.click();
    await expect(priority).toHaveAttribute('aria-checked', 'true');
    await deliveryStep.getByRole('button', {name: 'Continue to payment'}).click();

    const paymentStep = page.getByRole('region', {name: /Payment Method/});
    await expect(paymentStep.getByText('No payment method is available at the moment')).toBeVisible({timeout: 30_000});
    await expect(paymentStep).toContainText('Private customers pay online');
    await expect(paymentStep.getByRole('radio')).toHaveCount(0);

    expect(readMoney(await subtotalRow(page, 'en').innerText())).toBe(730);
    await expect(page.getByText('excl. VAT').first()).toBeVisible();
});
