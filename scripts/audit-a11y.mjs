#!/usr/bin/env node
// Structural accessibility audit of the rendered pages.
//
//   npm run audit:a11y                          # http://localhost:3200
//   npm run audit:a11y -- https://globeguard.ch
//
// Exits non-zero on a finding, so it can gate a release. It checks what is objectively
// decidable from server output - document language, one h1, heading order, image alt text,
// named form controls, unique ids, named links and buttons, a working skip link and a single
// main landmark - and deliberately says nothing about colour contrast, focus order or
// keyboard traps, which need a real browser and a real person.
const base = process.argv[2] || 'http://localhost:3200';
const pages = [
    '/',
    '/produkte',
    '/produkte/basic',
    '/products/gg-basic-car-bentley',
    '/geraet-finden',
    '/faq',
    '/kontakt',
    '/track-order',
    '/sign-in',
    '/cart',
    '/en',
    '/unterstuetzte-marken',
];

const findings = [];
const add = (page, rule, detail) => findings.push({page, rule, detail});

function tags(html, name) {
    const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
    const out = [];
    let m;
    while ((m = re.exec(html))) out.push(m[1]);
    return out;
}

const attr = (s, name) => {
    const m = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(s);
    return m ? m[1] : null;
};

for (const page of pages) {
    const res = await fetch(base + page, {redirect: 'follow'});
    const html = await res.text();
    if (!res.ok) {
        add(page, 'status', `${res.status}`);
        continue;
    }

    // 1. lang on <html>
    const htmlTag = tags(html, 'html')[0] ?? '';
    const lang = attr(htmlTag, 'lang');
    if (!lang) add(page, 'html-has-lang', 'missing lang attribute');
    else if (page.startsWith('/en') && !lang.startsWith('en')) add(page, 'html-lang', `lang="${lang}" on an English page`);
    else if (!page.startsWith('/en') && !lang.startsWith('de')) add(page, 'html-lang', `lang="${lang}" on a German page`);

    // 2. exactly one <h1>
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    if (h1s.length === 0) add(page, 'page-has-heading-one', 'no <h1>');
    if (h1s.length > 1) add(page, 'page-has-heading-one', `${h1s.length} <h1> elements: ${h1s.join(' | ').slice(0, 120)}`);

    // 3. heading order never skips a level
    const levels = [...html.matchAll(/<h([1-6])\b/gi)].map(m => Number(m[1]));
    for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
            add(page, 'heading-order', `h${levels[i - 1]} followed by h${levels[i]}`);
            break;
        }
    }

    // 4. every <img> has alt (empty alt is fine and means decorative)
    for (const img of tags(html, 'img')) {
        if (attr(img, 'alt') === null && !/\baria-hidden="true"/.test(img)) {
            add(page, 'image-alt', `<img ${img.trim().slice(0, 90)}>`);
        }
    }

    // 5. every form control is named: id+label, aria-label or aria-labelledby
    const labelFor = new Set([...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/gi)].map(m => m[1]));
    for (const name of ['input', 'select', 'textarea']) {
        for (const control of tags(html, name)) {
            const type = (attr(control, 'type') || '').toLowerCase();
            if (type === 'hidden' || type === 'submit' || type === 'button') continue;
            // aria-hidden + tabindex=-1 is how a component library keeps its own form-value input
            // out of the accessibility tree. Such an input needs no name.
            if (/aria-hidden="true"/.test(control)) continue;
            const id = attr(control, 'id');
            const named = (id && labelFor.has(id)) || attr(control, 'aria-label') || attr(control, 'aria-labelledby') || attr(control, 'title');
            if (!named) add(page, 'form-control-name', `<${name} ${control.trim().slice(0, 90)}>`);
        }
    }

    // 6. duplicate ids break label[for] and aria references
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    const seen = new Set();
    const dup = new Set();
    for (const id of ids) (seen.has(id) ? dup : seen).add(id);
    if (dup.size) add(page, 'duplicate-id', [...dup].slice(0, 6).join(', '));

    // 7. links and buttons need an accessible name
    for (const [tag, re] of [['a', /<a\b([^>]*)>([\s\S]*?)<\/a>/gi], ['button', /<button\b([^>]*)>([\s\S]*?)<\/button>/gi]]) {
        for (const m of html.matchAll(re)) {
            const attrs = m[1];
            const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            const hasSvgTitle = /<title[^>]*>[^<]+<\/title>/i.test(m[2]);
            // An <img alt="…"> inside the link names it, as does an aria-label on a child.
            const innerImgAlt = [...m[2].matchAll(/<img\b[^>]*\balt="([^"]+)"/gi)].length > 0;
            const innerAriaLabel = /\baria-label="[^"]+"/i.test(m[2]);
            const named =
                text || attr(attrs, 'aria-label') || attr(attrs, 'aria-labelledby') || attr(attrs, 'title') || hasSvgTitle || innerImgAlt || innerAriaLabel;
            if (!named && !/aria-hidden="true"/.test(attrs)) {
                add(page, `${tag}-name`, `<${tag} ${attrs.trim().slice(0, 90)}>`);
            }
        }
    }

    // 8. a skip link as the first focusable element inside <body>, pointing at a real target
    const bodyStart = html.search(/<body[\s>]/i);
    const head = bodyStart >= 0 ? html.slice(bodyStart, bodyStart + 1500) : '';
    const skip = /<a[\s][^>]*href="#([A-Za-z0-9_-]+)"/i.exec(head);
    if (!skip) {
        add(page, 'skip-link', 'no skip link at the start of <body>');
    } else if (!new RegExp(`id="${skip[1]}"`).test(html)) {
        add(page, 'skip-link-target', `#${skip[1]} has no matching element`);
    }

    // 9. one <main>
    const mains = tags(html, 'main').length;
    if (mains !== 1) add(page, 'landmark-main', `${mains} <main> elements`);
}

const byRule = new Map();
for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
}

console.log(`${pages.length} pages checked against ${base}\n`);
if (!findings.length) {
    console.log('No structural problems found.');
} else {
    for (const [rule, items] of [...byRule.entries()].sort((a, b) => b[1].length - a[1].length)) {
        console.log(`${rule}  (${items.length})`);
        const shown = new Set();
        for (const item of items) {
            const key = item.detail;
            if (shown.has(key)) continue;
            shown.add(key);
            if (shown.size > 4) break;
            console.log(`   ${item.page.padEnd(30)} ${item.detail}`);
        }
        const pagesAffected = [...new Set(items.map(i => i.page))];
        console.log(`   pages: ${pagesAffected.join(', ')}\n`);
    }
}

process.exit(findings.length === 0 ? 0 : 1);
