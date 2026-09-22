import {beforeEach, describe, expect, it, vi} from 'vitest';

const queryMock = vi.fn();

vi.mock('@/lib/vendure/api', () => ({
    query: (...args: unknown[]) => queryMock(...args),
}));

import {isTooManyAttemptsError, normalizeOrderCode, trackOrder} from '../order-tracking';
import {getSitemapCollections, getSitemapProducts} from '../sitemap-data';

beforeEach(() => {
    queryMock.mockReset();
});

describe('trackOrder', () => {
    it('returns the order, forwards the visitor IP and the locale', async () => {
        const order = {code: 'GG123456', state: 'PaymentSettled'};
        queryMock.mockResolvedValueOnce({data: {trackOrder: order}});

        const result = await trackOrder(' gg123456 ', ' Kunde@Example.com ', {locale: 'de', clientIp: '203.0.113.7'});

        expect(result).toEqual({status: 'found', order});
        const [, variables, options] = queryMock.mock.calls[0];
        expect(variables).toEqual({code: 'GG123456', emailAddress: 'Kunde@Example.com'});
        expect(options.languageCode).toBe('de');
        expect(options.fetch.headers['X-Forwarded-For']).toBe('203.0.113.7');
        expect(options.fetch.cache).toBe('no-store');
    });

    it('maps null to not-found without forwarding a header when no IP is known', async () => {
        queryMock.mockResolvedValueOnce({data: {trackOrder: null}});

        const result = await trackOrder('GG000000', 'x@example.com', {locale: 'en'});

        expect(result).toEqual({status: 'not-found'});
        expect(queryMock.mock.calls[0][2].fetch.headers).toEqual({});
    });

    it('maps the backend rate-limit error (de and en message) to too-many-attempts', async () => {
        queryMock.mockRejectedValueOnce(new Error('Zu viele Versuche. Bitte in 10 Minuten erneut versuchen.'));
        expect(await trackOrder('GG000000', 'x@example.com')).toEqual({status: 'too-many-attempts'});

        queryMock.mockRejectedValueOnce(new Error('Too many attempts. Please try again in 10 minutes.'));
        expect(await trackOrder('GG000000', 'x@example.com')).toEqual({status: 'too-many-attempts'});
    });

    it('maps any other failure to error', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        queryMock.mockRejectedValueOnce(new Error('HTTP error! status: 502'));

        expect(await trackOrder('GG000000', 'x@example.com')).toEqual({status: 'error'});
        errorSpy.mockRestore();
    });
});

describe('order-tracking helpers', () => {
    it('normalizes codes and recognises the rate-limit message only', () => {
        expect(normalizeOrderCode('  gg123456 ')).toBe('GG123456');
        expect(isTooManyAttemptsError(new Error('Too many attempts.'))).toBe(true);
        expect(isTooManyAttemptsError(new Error('No data returned from Vendure API'))).toBe(false);
        expect(isTooManyAttemptsError(undefined)).toBe(false);
    });
});

describe('sitemap data', () => {
    function productPage(from: number, count: number, totalItems: number) {
        return {
            data: {
                products: {
                    totalItems,
                    items: Array.from({length: count}, (_, i) => ({slug: `p-${from + i}`, updatedAt: '2026-09-01T00:00:00.000Z'})),
                },
            },
        };
    }

    it('pages through products in chunks of 100 until totalItems is reached', async () => {
        queryMock
            .mockResolvedValueOnce(productPage(0, 100, 233))
            .mockResolvedValueOnce(productPage(100, 100, 233))
            .mockResolvedValueOnce(productPage(200, 33, 233));

        const entries = await getSitemapProducts();

        expect(entries).toHaveLength(233);
        expect(entries[0]).toEqual({slug: 'p-0', lastModified: '2026-09-01T00:00:00.000Z'});
        expect(entries[232].slug).toBe('p-232');
        expect(queryMock.mock.calls.map((call) => call[1])).toEqual([
            {take: 100, skip: 0},
            {take: 100, skip: 100},
            {take: 100, skip: 200},
        ]);
    });

    it('stops on an empty page, skips the root collection and empty leaf collections', async () => {
        queryMock.mockResolvedValueOnce({
            data: {
                collections: {
                    totalItems: 5,
                    items: [
                        {slug: '__root_collection__', updatedAt: null, parent: null, children: [{id: '2'}], productVariants: {totalItems: 0}},
                        {slug: 'basic', updatedAt: '2026-09-02T00:00:00.000Z', parent: {slug: 'produkte'}, children: [{id: '3'}], productVariants: {totalItems: 0}},
                        {slug: 'pro', updatedAt: null, parent: {slug: 'produkte'}, children: [], productVariants: {totalItems: 76}},
                        {slug: 'pro-add-on', updatedAt: null, parent: {slug: 'zubehoer'}, children: [], productVariants: {totalItems: 0}},
                        {slug: 'zubehoer', updatedAt: null, parent: {slug: 'produkte'}, children: [{id: '9'}], productVariants: {totalItems: 0}},
                    ],
                },
            },
        });

        const entries = await getSitemapCollections();

        expect(entries).toEqual([
            {slug: 'basic', lastModified: '2026-09-02T00:00:00.000Z'},
            {slug: 'pro', lastModified: null},
            {slug: 'zubehoer', lastModified: null},
        ]);
        expect(queryMock).toHaveBeenCalledTimes(1);
    });
});
