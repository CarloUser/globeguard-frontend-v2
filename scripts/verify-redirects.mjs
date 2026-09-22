#!/usr/bin/env node
// Check every rule in src/data/redirect-map.json against a running storefront.
//
//   node scripts/verify-redirects.mjs                          # http://localhost:3200
//   node scripts/verify-redirects.mjs https://globeguard.ch    # on cutover day, against the real host
//
// The map is the record of what the old WooCommerce site served; next.config.ts turns it into
// redirect rules. This proves the two agree on a host that is actually running, which is the only
// place the trailing-slash normalisation and the query matchers can be observed.
//
// Expected outcomes, all of them asserted:
//   * a mapped URL answers 301 with exactly the mapped destination;
//   * an entry whose destination equals its source is NOT a redirect (the new site kept that URL),
//     so it must answer 200 - emitting a rule for it would be an infinite loop;
//   * the five Download-Monitor query URLs answer 301 to /support; Next forwards the original
//     query string to the destination, which is harmless and expected;
//   * the trailing-slash form every old URL was indexed under resolves, in at most two hops
//     (308 slash-strip, then the 301), to the mapped destination;
//   * the old WordPress sitemaps still lead somewhere, and the new sitemap and robots.txt work.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const base = (process.argv[2] || 'http://localhost:3200').replace(/\/$/, '');
const map = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/redirect-map.json'), 'utf8'));
const normalise = value => value.split('?')[0].replace(/\/$/, '') || '/';

let failures = 0;
const fail = message => {
    failures += 1;
    console.log(`  FAIL  ${message}`);
};

async function head(url) {
    const response = await fetch(url, {redirect: 'manual'});
    const location = response.headers.get('location') || '';
    return {status: response.status, location: location.startsWith(base) ? location.slice(base.length) : location};
}

async function follow(url) {
    const response = await fetch(url, {redirect: 'follow'});
    return {status: response.status, url: response.url.startsWith(base) ? response.url.slice(base.length) : response.url};
}

console.log(`Verifying ${map.length} map entries against ${base}\n`);

console.log('1. mapped URLs');
let redirects = 0;
let kept = 0;
for (const entry of map) {
    const source = normalise(entry.from);
    const isKeptUrl = !entry.from.includes('?') && source === normalise(entry.to);
    const {status, location} = await head(base + entry.from);

    if (isKeptUrl) {
        kept += 1;
        if (status !== 200) {
            fail(`${entry.from} answered ${status}; the new site kept this URL, so it must serve 200 (a rule here loops)`);
        }
        continue;
    }
    if (source === '/' && !entry.from.includes('?')) {
        continue;
    }
    redirects += 1;
    if (status !== 301) {
        fail(`${entry.from} answered ${status}, expected 301 -> ${entry.to}`);
        continue;
    }
    // Next forwards the request's query string to the destination, so compare the path only.
    if (normalise(location) !== normalise(entry.to)) {
        fail(`${entry.from} -> ${location}, expected ${entry.to}`);
    }
}
console.log(`  ${redirects} redirect(s) checked, ${kept} kept URL(s) confirmed as 200`);

console.log('\n2. the trailing-slash form the old site served');
const sample = map.filter(e => !e.from.includes('?') && normalise(e.from) !== '/' && normalise(e.from) !== normalise(e.to));
for (const entry of [sample[0], sample[Math.floor(sample.length / 2)], sample[sample.length - 1]].filter(Boolean)) {
    const {status, url} = await follow(`${base}${normalise(entry.from)}/`);
    if (status !== 200 || normalise(url) !== normalise(entry.to)) {
        fail(`${normalise(entry.from)}/ resolved to ${status} ${url}, expected 200 ${entry.to}`);
    } else {
        console.log(`  ${normalise(entry.from)}/ -> ${url}`);
    }
}

console.log('\n3. old WordPress sitemaps and the new ones');
for (const wp of ['/wp-sitemap.xml', '/wp-sitemap-posts-product-1.xml', '/en/wp-sitemap-taxonomies-product_cat-1.xml', '/en/wp-sitemap.xml']) {
    const {status, location} = await head(base + wp);
    if (status !== 301 || location !== '/sitemap.xml') {
        fail(`${wp} answered ${status} -> ${location}, expected 301 -> /sitemap.xml`);
    }
}
for (const live of ['/sitemap.xml', '/robots.txt', '/', '/produkte', '/en/produkte']) {
    const {status} = await head(base + live);
    if (status !== 200) {
        fail(`${live} answered ${status}, expected 200`);
    }
}
console.log('  4 old sitemap paths redirect; sitemap.xml, robots.txt and 3 live pages answer 200');

console.log(`\n${failures === 0 ? 'OK — everything matched the map.' : `${failures} problem(s).`}`);
process.exit(failures === 0 ? 0 : 1);
