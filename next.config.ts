import fs from 'node:fs';
import path from 'node:path';

import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
// next/image refuses a private-IP upstream in a production build. That is the right default for a
// deployed site, but it also means a locally built standalone bundle renders no product image at
// all, because the assets come from http://localhost:3000 — which is exactly the bundle worth
// looking at before a deploy. ALLOW_LOCAL_IMAGE_HOSTS=true opts back in for that case only; it
// must never be set on a public host.
const allowLocalVendureImages =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_IMAGE_HOSTS === 'true';

// Hostname (no protocol/path) that serves Vendure assets, e.g. "api.globeguard.ch".
const assetHost = (process.env.NEXT_PUBLIC_ASSET_HOST || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
        protocol: 'http',
        hostname: 'localhost',
    },
    {
        protocol: 'http',
        hostname: '127.0.0.1',
    },
];

if (assetHost && assetHost !== 'localhost' && assetHost !== '127.0.0.1') {
    remotePatterns.push({
        protocol: 'https',
        hostname: assetHost,
    });
}

// 301s from the old WooCommerce site. src/data/redirect-map.json is the single source of truth
// (203 URLs, generated and verified in docs/redirect-map.md); it is read here at build time rather
// than imported, so no `resolveJsonModule` is needed and the file stays plain data.
//
// These rules run before the next-intl middleware, so `to` is used exactly as written: an entry
// under /en/ already carries its prefix and must not be prefixed again.
type RedirectMapEntry = {from: string; to: string};

const redirectMap: RedirectMapEntry[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/data/redirect-map.json'), 'utf8'),
);

type RedirectRule = {
    source: string;
    destination: string;
    statusCode: 301;
    has?: Array<{type: 'query'; key: string; value: string}>;
};

// 301, not `permanent: true` (308): this is a search-engine migration off WordPress, and 301 is
// what every crawler and every legacy client already understands.
const normalisePath = (value: string) => value.split('?')[0].replace(/\/$/, '') || '/';

/**
 * Every static route the storefront serves itself, read from src/app/[locale] (dynamic segments
 * and route groups excluded, since a redirect source is always a literal path).
 *
 * A redirect may never point away from a URL this app owns. The map records what the old
 * WooCommerce site served, and some of those paths exist on the new site too — sometimes
 * unchanged (/faq, /impressum, /support), sometimes with a different meaning: the old English
 * checkout redirected to the cart, so the map says `/en/checkout -> /en/cart`, and emitting that
 * made the new English checkout unreachable. Deriving the list from the filesystem means a route
 * added later is protected without anyone remembering this file.
 */
function ownRoutes(): Set<string> {
    const appDir = path.join(process.cwd(), 'src', 'app', '[locale]');
    const routes = new Set<string>();

    const walk = (dir: string, prefix: string) => {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            if (!entry.isDirectory()) {
                continue;
            }
            // [slug] is dynamic and (group) does not appear in the URL: neither can be a literal
            // redirect source, so neither belongs in this set.
            if (entry.name.startsWith('[') || entry.name.startsWith('(') || entry.name.startsWith('_')) {
                continue;
            }
            const routePath = `${prefix}/${entry.name}`;
            const child = path.join(dir, entry.name);
            if (fs.existsSync(path.join(child, 'page.tsx'))) {
                routes.add(routePath);
            }
            walk(child, routePath);
        }
    };

    walk(appDir, '');
    return routes;
}

function buildRedirects(): RedirectRule[] {
    const withQuery: RedirectRule[] = [];
    const plain: RedirectRule[] = [];
    const own = ownRoutes();
    const shadowed: string[] = [];

    // '/en/produkte' is the English '/produkte'; a source is checked against the app's routes with
    // the locale prefix removed.
    const withoutLocale = (value: string) => value.replace(/^\/en(?=\/|$)/, '') || '/';

    for (const {from, to} of redirectMap) {
        const [rawPath, query] = from.split('?');
        // Next normalises the trailing slash before matching, so one slash-less source catches
        // both /produkt/x and /produkt/x/ (verified with curl, see docs/redirect-map.md 6.1).
        const source = normalisePath(rawPath);

        if (query) {
            const [key, ...rest] = query.split('=');
            // The Download-Monitor taxonomy URLs are query strings on "/", so they need a `has`
            // matcher and must be tried before any rule that matches the bare path.
            withQuery.push({
                source,
                has: [{type: 'query', key, value: rest.join('=')}],
                destination: to,
                statusCode: 301,
            });
            continue;
        }
        if (source === '/') {
            // "/" -> "/" is a no-op, and a catch-all on "/" would shadow everything else.
            continue;
        }
        // The map documents every old URL, including the ones the new site serves itself — some
        // unchanged (/faq, /impressum, /support, /en/cart), some with a different meaning
        // (/en/checkout, which the old site sent to the cart). Redirecting either would take the
        // URL away from the app: the first as a loop, the second by making the page unreachable.
        if (source === normalisePath(to) || own.has(withoutLocale(source))) {
            shadowed.push(source);
            continue;
        }
        plain.push({source, destination: to, statusCode: 301});
    }

    // The old WordPress sitemap index and its 15 child sitemaps are indexed and re-fetched by
    // Google long after a cutover; a 404 there slows discovery of the new URLs down. They are
    // deliberately not in redirect-map.json (infrastructure, not content).
    const sitemaps: RedirectRule[] = [
        {source: '/wp-sitemap.xml', destination: '/sitemap.xml', statusCode: 301},
        {source: '/wp-sitemap:rest(.*).xml', destination: '/sitemap.xml', statusCode: 301},
        {source: '/en/wp-sitemap.xml', destination: '/sitemap.xml', statusCode: 301},
        {source: '/en/wp-sitemap:rest(.*).xml', destination: '/sitemap.xml', statusCode: 301},
    ];

    const rules = [...withQuery, ...plain, ...sitemaps];

    if (shadowed.length) {
        console.log(
            `[redirects] ${shadowed.length} map entr${shadowed.length === 1 ? 'y' : 'ies'} not emitted — the storefront serves ` +
                `${shadowed.length === 1 ? 'this URL' : 'these URLs'} itself: ${shadowed.join(', ')}`,
        );
    }

    // A redirect whose destination is itself a source sends the browser round again. One identity
    // entry in the map was enough to make /faq, /impressum and /support unreachable behind
    // ERR_TOO_MANY_REDIRECTS, and nothing in a build or a typecheck would have noticed. Fail the
    // build instead: this list is data, and data can change without anyone re-reading this file.
    const sources = new Map(rules.filter(rule => !rule.has).map(rule => [rule.source, rule.destination]));
    const chained = [...sources.entries()]
        .filter(([, destination]) => sources.has(normalisePath(destination)))
        .map(([source, destination]) => `${source} -> ${destination} -> ${sources.get(normalisePath(destination))}`);
    if (chained.length) {
        throw new Error(
            `src/data/redirect-map.json produces ${chained.length} chained redirect(s):\n  ${chained.join('\n  ')}\n` +
                'Point each source straight at its final destination.',
        );
    }

    return rules;
}

const nextConfig: NextConfig = {
    output: 'standalone',
    redirects: async () => buildRedirects(),
    // messages/<locale>/*.json are read with fs at request time (src/i18n/request.ts), so they
    // are not discovered by the file tracer and must be added to the standalone output explicitly.
    outputFileTracingIncludes: {
        '/*': ['./messages/**/*'],
    },
    turbopack: {
        root: process.cwd(),
    },
    images: {
        dangerouslyAllowLocalIP: allowLocalVendureImages,
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
        remotePatterns,
    },
};

export default withNextIntl(nextConfig);
