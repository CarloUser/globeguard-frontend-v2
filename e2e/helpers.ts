import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {expect, type Locator, type Page} from '@playwright/test';

/**
 * Shared helpers for the storefront e2e suite: money parsing, the backend dev mailbox
 * (every outgoing mail is written to disk as JSON), registration + e-mail verification
 * and the few page fragments that several specs need to address.
 */

/** Dev mailbox of the Vendure backend: one JSON file per sent e-mail. */
export const MAILBOX_DIR =
    process.env.E2E_MAILBOX_DIR || 'C:/GlobeGuard/globeguard-backend/static/email/test-emails';

export type UiLocale = 'de' | 'en';

/** Product page: the note under the live total, used to anchor on the amount above it. */
export const VAT_NOTE: Record<UiLocale, string> = {
    de: 'zzgl. MwSt. – wird an der Kasse nach Lieferland berechnet',
    en: 'excl. VAT – calculated at checkout based on delivery country',
};

/** Thousands separators Intl may emit for de-CH / en-CH, plus the NBSP variants. */
const MONEY_SEPARATORS = /[\u00a0\u202f\u2009\u2019\u2018\u02bc'`\s]/g;

/**
 * Parses a rendered price such as `CHF 1’234.00`, `CHF 730.00` or `CHF 1 234.00`
 * (apostrophe, NBSP or narrow NBSP as the group separator) into a number.
 */
export function readMoney(text: string | null | undefined): number {
    const cleaned = String(text ?? '')
        .replace(/[A-Za-z]/g, '')
        .replace(MONEY_SEPARATORS, '');
    const match = cleaned.match(/-?\d+(?:\.\d+)?/);

    if (!match) {
        throw new Error(`No money amount found in ${JSON.stringify(text)}`);
    }

    return Number(match[0]);
}

/** Escapes a literal string for use inside a RegExp. */
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface MailboxMessage {
    file: string;
    mtimeMs: number;
    date: string;
    from: string;
    recipient: string;
    subject: string;
    body: string;
}

/**
 * The recipient as it appears inside a mailbox file name. The Vendure e-mail plugin names
 * every file `normalizeString(\`${isoDate} ${recipient} ${subject}\`, '_')`: diacritics are
 * folded, the string is lower-cased, a punctuation class is dropped (so `@` disappears while
 * `.` and `-` survive) and each run of whitespace becomes `_`.
 */
function mailboxNameToken(recipient: string): string {
    return recipient
        .normalize('NFD')
        .replace(/\u00df/g, 'ss')
        .replace(/\u0308/g, 'e')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[!"£$%^&*()+[\]{};:@#~?\\/,|><`¬'=‘’©®™]/g, '')
        .replace(/\s+/g, '_');
}

/**
 * Reads the dev mailbox. When `recipient` is given, the file name is filtered first, so a
 * mailbox that grows over a run costs one `readdir` per poll instead of a `stat` plus a
 * `JSON.parse` of every mail that was ever sent.
 */
function readMailbox(recipient?: string): MailboxMessage[] {
    if (!existsSync(MAILBOX_DIR)) {
        return [];
    }

    const nameToken = recipient ? `_${mailboxNameToken(recipient.trim())}_` : null;
    const messages: MailboxMessage[] = [];

    for (const name of readdirSync(MAILBOX_DIR)) {
        const lowerName = name.toLowerCase();

        if (!lowerName.endsWith('.json')) {
            continue;
        }

        if (nameToken !== null && !lowerName.includes(nameToken)) {
            continue;
        }

        const file = join(MAILBOX_DIR, name);

        try {
            const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<MailboxMessage>;
            messages.push({
                file,
                mtimeMs: statSync(file).mtimeMs,
                date: String(parsed.date ?? ''),
                from: String(parsed.from ?? ''),
                recipient: String(parsed.recipient ?? ''),
                subject: String(parsed.subject ?? ''),
                body: String(parsed.body ?? ''),
            });
        } catch {
            // A mail that is still being written simply is not ready yet.
        }
    }

    return messages.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

/** Newest mailbox entry for `recipient`, or null while none has arrived yet. */
export function findLatestMail(recipient: string, sinceMs = 0): MailboxMessage | null {
    const wanted = recipient.trim().toLowerCase();

    return (
        readMailbox(recipient).find(
            (message) => message.recipient.trim().toLowerCase() === wanted && message.mtimeMs >= sinceMs,
        ) ?? null
    );
}

/** Waits for the worker to deliver a mail to `recipient` (mails arrive within seconds). */
export async function waitForMail(recipient: string, sinceMs = 0, timeoutMs = 60_000): Promise<MailboxMessage> {
    let found: MailboxMessage | null = null;

    await expect
        .poll(
            () => {
                found = findLatestMail(recipient, sinceMs);
                return found === null ? null : found.subject;
            },
            {
                timeout: timeoutMs,
                intervals: [250, 500, 1000],
                message: `No e-mail for ${recipient} in ${MAILBOX_DIR}`,
            },
        )
        .not.toBeNull();

    if (found === null) {
        throw new Error(`No e-mail for ${recipient}`);
    }

    return found;
}

/**
 * Pulls the `/verify?token=...` link out of an e-mail body and rewrites its origin to
 * `baseUrl`: the backend renders links with its own FRONTEND_BASE_URL (port 3001) while
 * the suite drives the standalone build on another port.
 */
export function extractVerificationUrl(body: string, baseUrl: string): string {
    const match = body.match(/https?:\/\/[^\s"'<>]*\/verify\?token=[^\s"'<>&]+/i);

    if (!match) {
        throw new Error('No verification link found in the e-mail body');
    }

    const link = new URL(match[0].replace(/&amp;/g, '&'));
    const target = new URL(baseUrl);
    link.protocol = target.protocol;
    link.host = target.host;

    return link.toString();
}

export interface TestCustomer {
    emailAddress: string;
    password: string;
    firstName: string;
    lastName: string;
}

let customerCounter = 0;

/** Unique, throwaway customer credentials for one run. */
export function newTestCustomer(prefix = 'e2e'): TestCustomer {
    customerCounter += 1;

    return {
        emailAddress: `${prefix}-${Date.now()}-${customerCounter}@globeguard-e2e.test`,
        password: 'GlobeGuard-E2E-2026!',
        firstName: 'Ella',
        lastName: 'Testfahrerin',
    };
}

/** Signs an already verified customer in through the German /sign-in form. */
export async function signIn(page: Page, customer: TestCustomer): Promise<void> {
    await page.goto('/sign-in');
    await page.getByLabel('E-Mail', {exact: true}).fill(customer.emailAddress);
    await page.getByLabel('Passwort', {exact: true}).fill(customer.password);
    await page.getByRole('button', {name: 'Anmelden', exact: true}).click();
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), {timeout: 30_000});
}

/**
 * Registers a fresh customer through the German UI, confirms the address with the token
 * from the backend dev mailbox and signs the new account in. Returns the credentials.
 */
export async function registerAndVerify(page: Page, customer = newTestCustomer()): Promise<TestCustomer> {
    const since = Date.now() - 1000;

    await page.goto('/register');
    await page.getByLabel('E-Mail-Adresse').fill(customer.emailAddress);
    await page.getByLabel('Vorname').fill(customer.firstName);
    await page.getByLabel('Nachname').fill(customer.lastName);
    await page.getByLabel('Passwort', {exact: true}).fill(customer.password);
    await page.getByLabel('Passwort bestätigen').fill(customer.password);
    await page.getByRole('button', {name: 'Konto erstellen'}).click();
    await page.waitForURL(/\/verify-pending/, {timeout: 30_000});

    const mail = await waitForMail(customer.emailAddress, since);
    const verifyUrl = extractVerificationUrl(mail.body, new URL(page.url()).origin);

    await page.goto(verifyUrl);
    await expect(page.getByRole('heading', {name: 'Konto bestätigt!'})).toBeVisible({timeout: 30_000});

    await signIn(page, customer);

    return customer;
}

/** The configurator's live total: the amount directly above the "zzgl. MwSt." note. */
export function liveTotal(page: Page, locale: UiLocale = 'de'): Locator {
    return page.getByText(VAT_NOTE[locale], {exact: true}).locator('xpath=preceding-sibling::div[1]');
}

/** Waits until the configurator's live total settles on `expected` (NET CHF). */
export async function expectLiveTotal(page: Page, expected: number, locale: UiLocale = 'de'): Promise<void> {
    await expect
        .poll(async () => readMoney(await liveTotal(page, locale).innerText()), {
            timeout: 10_000,
            message: `live total should be ${expected}`,
        })
        .toBe(expected);
}

/** Heading of the configurator's "also added to the cart" summary line, per locale. */
const ADD_ON_SUMMARY_HEADING: Record<UiLocale, string> = {
    de: 'Wird zusätzlich in den Warenkorb gelegt:',
    en: 'Also added to the cart:',
};

/** The configurator paragraph that lists the add-on lines and their combined NET price. */
export function addOnSummary(page: Page, locale: UiLocale = 'de'): Locator {
    return page.locator('p', {hasText: ADD_ON_SUMMARY_HEADING[locale]});
}

/** Picks an option of a Base UI select identified by its accessible name. */
export async function chooseSelectOption(page: Page, selectName: string, optionName: string): Promise<void> {
    await page.getByRole('combobox', {name: selectName}).click();
    await page.getByRole('option', {name: optionName, exact: true}).click();
}

/**
 * A variant option of a multi-variant product ("Dauer" on the licence products). The radio
 * itself is `sr-only`, so the visible label is the thing to look at and to click.
 */
export function variantOption(page: Page, optionName: string): Locator {
    return page.locator('label').filter({hasText: new RegExp(`^\\s*${escapeRegExp(optionName)}\\s*$`)});
}

/** Selects a variant option by clicking its label and waits for the radio to report it. */
export async function chooseVariantOption(page: Page, optionName: string): Promise<void> {
    // Keep the page at the top so the sticky header cannot cover the option that
    // Playwright would otherwise scroll underneath it.
    await page.evaluate(() => window.scrollTo(0, 0));
    await variantOption(page, optionName).click();
    await expect(page.getByRole('radio', {name: optionName, exact: true})).toHaveAttribute('aria-checked', 'true');
}

/** The success toast shown after items were added to the cart. */
export function cartToast(page: Page, text: string | RegExp): Locator {
    return page.locator('[data-sonner-toast]').filter({hasText: text});
}

/** Adds the default BASIC Fiat/Alfa/Lancia model-year-2020 configuration (3 lines, NET 730). */
export async function addBasicFiat2020(page: Page): Promise<void> {
    await page.goto('/products/gg-basic-car-fiat-alfa-romeo-lancia?year=2020');
    await expectLiveTotal(page, 730);
    await page.getByRole('button', {name: 'In den Warenkorb'}).click();
    await expect(cartToast(page, 'Warenkorb gelegt')).toBeVisible({timeout: 30_000});
}

/** Label of the NET subtotal row in the cart / checkout summary, per locale. */
const SUBTOTAL_LABEL: Record<UiLocale, string> = {
    de: 'Zwischensumme (netto)',
    en: 'Subtotal (net)',
};

/** The summary row holding the NET subtotal (innermost element carrying label + amount). */
export function subtotalRow(page: Page, locale: UiLocale = 'de'): Locator {
    return page.locator('div').filter({has: page.getByText(SUBTOTAL_LABEL[locale], {exact: true})}).last();
}

/** The cart row of a given SKU: the innermost block that holds both the SKU and its remove button. */
export function cartRowBySku(page: Page, sku: string, removeLabel = 'Artikel entfernen'): Locator {
    return page
        .locator('div')
        .filter({has: page.getByText(`Art.-Nr.: ${sku}`)})
        .filter({has: page.getByRole('button', {name: removeLabel})})
        .last();
}

export interface SwissAddress {
    street: string;
    city: string;
    postalCode: string;
    province: string;
    phone: string;
}

export const SWISS_ADDRESS: SwissAddress = {
    street: 'Untermühlestrasse 12',
    city: 'Cham',
    postalCode: '6330',
    province: 'Zug',
    phone: '+41 41 000 00 00',
};

/** Field labels of the checkout address dialog per locale. */
const ADDRESS_LABELS: Record<UiLocale, Record<keyof SwissAddress | 'save', string>> = {
    de: {
        street: 'Strasse *',
        city: 'Stadt',
        postalCode: 'Postleitzahl',
        province: 'Bundesland/Kanton',
        phone: 'Telefonnummer',
        save: 'Adresse speichern',
    },
    en: {
        street: 'Street Address *',
        city: 'City',
        postalCode: 'Postal Code',
        province: 'State/Province',
        phone: 'Phone Number',
        save: 'Save address',
    },
};

/**
 * Fills the checkout "add shipping address" dialog (it opens by itself for a customer
 * without saved addresses) with a Swiss address and saves it.
 */
export async function fillCheckoutAddressDialog(page: Page, locale: UiLocale = 'de'): Promise<void> {
    const labels = ADDRESS_LABELS[locale];
    const dialog = page.getByRole('dialog').filter({has: page.getByLabel(labels.street)});

    await expect(dialog).toBeVisible({timeout: 30_000});
    await dialog.getByLabel(labels.street).fill(SWISS_ADDRESS.street);
    await dialog.getByLabel(labels.city, {exact: true}).fill(SWISS_ADDRESS.city);
    await dialog.getByLabel(labels.postalCode, {exact: true}).fill(SWISS_ADDRESS.postalCode);
    await dialog.getByLabel(labels.province, {exact: true}).fill(SWISS_ADDRESS.province);
    await dialog.getByLabel(labels.phone, {exact: true}).fill(SWISS_ADDRESS.phone);
    await dialog.getByRole('button', {name: labels.save}).click();
    await expect(dialog).toBeHidden({timeout: 30_000});
}

/** Switches the storefront language through the navbar picker and waits for the new URL. */
export async function switchLanguage(page: Page, target: 'Deutsch' | 'English', expectedUrl: RegExp): Promise<void> {
    await page.getByRole('button', {name: /Sprache wechseln|Switch language/}).click();
    await page.getByRole('menuitem', {name: target}).click();
    await page.waitForURL(expectedUrl, {timeout: 30_000});
}
