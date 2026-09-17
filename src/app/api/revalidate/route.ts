import {revalidateTag} from 'next/cache';
import {NextRequest, NextResponse} from 'next/server';

/**
 * On-demand revalidation webhook for the Vendure backend.
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATION_SECRET>
 *   Body: { "tags": string[] }   (max 100 tags)
 *
 * Tag vocabulary — must match the `tags` passed to `query()` / `cacheTag()` in the storefront
 * (see src/lib/vendure/cached.ts for the caching model):
 *   cart, active-order, products, collection, product-<slug>, collection-<slug>
 *
 * Tags are revalidated verbatim. There is no locale or currency expansion: the shop API is
 * queried per request in the active locale, and orders are CHF-only (EUR is display-only).
 */
const TAG_RULES: ReadonlyArray<string | RegExp> = [
    'cart',
    'active-order',
    'products',
    'collection',
    /^product-.+$/,
    /^collection-.+$/,
];

const MAX_TAGS_PER_REQUEST = 100;

function isKnownTag(tag: string): boolean {
    return TAG_RULES.some(rule => (typeof rule === 'string' ? rule === tag : rule.test(tag)));
}

export async function POST(request: NextRequest) {
    // Verify the secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATION_SECRET;

    if (!expectedToken) {
        console.error('REVALIDATION_SECRET environment variable not set');
        return NextResponse.json(
            {error: 'Server configuration error'},
            {status: 500}
        );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
            {error: 'Unauthorized'},
            {status: 401}
        );
    }

    try {
        const body = await request.json();
        const {tags} = body;

        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return NextResponse.json(
                {error: 'Missing or invalid "tags" array in request body'},
                {status: 400}
            );
        }

        if (tags.length > MAX_TAGS_PER_REQUEST) {
            return NextResponse.json(
                {error: `Too many tags (max ${MAX_TAGS_PER_REQUEST})`},
                {status: 400}
            );
        }

        const results: {tag: string; success: boolean; error?: string}[] = [];

        for (const tag of tags) {
            if (typeof tag !== 'string') {
                results.push({tag: String(tag), success: false, error: 'Invalid tag type'});
                continue;
            }

            if (!isKnownTag(tag)) {
                results.push({tag, success: false, error: 'Unknown tag'});
                continue;
            }

            try {
                revalidateTag(tag, {expire: 0});
                results.push({tag, success: true});
            } catch {
                results.push({tag, success: false, error: 'Revalidation failed'});
            }
        }

        const allSuccessful = results.every(r => r.success);

        return NextResponse.json(
            {
                revalidated: allSuccessful,
                results,
                timestamp: Date.now(),
            },
            {status: allSuccessful ? 200 : 207} // 207 = Multi-Status
        );
    } catch {
        return NextResponse.json(
            {error: 'Invalid JSON body'},
            {status: 400}
        );
    }
}
