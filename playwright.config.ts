import {defineConfig, devices} from '@playwright/test';

/**
 * End-to-end suite for the GlobeGuard storefront.
 *
 * The suite runs against an already running storefront (default http://localhost:3200,
 * override with E2E_BASE_URL) and the Vendure shop API behind it; it never starts or
 * stops a server itself. Specs share one browser and run sequentially because they all
 * mutate the same Vendure guest/customer sessions and the backend dev mailbox.
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: {timeout: 10_000},
    fullyParallel: false,
    workers: 1,
    retries: 0,
    forbidOnly: !!process.env.CI,
    reporter: [['list'], ['html', {outputFolder: 'playwright-report', open: 'never'}]],
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3200',
        headless: true,
        locale: 'de-CH',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'chromium',
            // A little taller than the default so the sticky header cannot cover elements
            // that Playwright scrolls to the top of the viewport.
            use: {...devices['Desktop Chrome'], viewport: {width: 1440, height: 1000}},
        },
    ],
});
