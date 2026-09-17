import fs from 'node:fs';
import path from 'node:path';
import {hasLocale} from 'next-intl';
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

type MessageTree = {[key: string]: unknown};

function isPlainObject(value: unknown): value is MessageTree {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merge `source` into `target` (objects merged key by key, everything else replaced).
 * Neither input is mutated.
 */
export function deepMergeMessages(target: MessageTree, source: MessageTree): MessageTree {
    const result: MessageTree = {...target};
    for (const [key, value] of Object.entries(source)) {
        const current = result[key];
        result[key] = isPlainObject(current) && isPlainObject(value) ? deepMergeMessages(current, value) : value;
    }
    return result;
}

/**
 * Sorted `*.json` file names of `messages/<locale>/`, or an empty list when the directory
 * does not exist. Every feature package owns one file there (one top-level namespace per
 * file) so that nobody has to edit the shared `messages/<locale>.json`.
 */
function listFeatureMessageFiles(dir: string): string[] {
    try {
        return fs
            .readdirSync(dir)
            .filter((file) => file.endsWith('.json'))
            .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR') {
            return [];
        }
        throw error;
    }
}

function readFeatureMessages(locale: string, dir: string, file: string): MessageTree {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error(`Invalid JSON in messages/${locale}/${file}: ${(error as Error).message}`);
    }
    if (!isPlainObject(parsed)) {
        throw new Error(`messages/${locale}/${file} must contain a JSON object at the top level`);
    }
    return parsed;
}

/**
 * messages = deepMerge(messages/<locale>.json, ...messages/<locale>/*.json sorted by file name).
 * The base file is bundled (dynamic import); the feature files are read from disk at request
 * time, which is why `messages/**` is added to `outputFileTracingIncludes` in next.config.ts.
 */
async function loadMessages(locale: string): Promise<MessageTree> {
    const base = (await import(`../../messages/${locale}.json`)).default as MessageTree;
    const dir = path.join(process.cwd(), 'messages', locale);
    return listFeatureMessageFiles(dir).reduce<MessageTree>(
        (merged, file) => deepMergeMessages(merged, readFeatureMessages(locale, dir, file)),
        base,
    );
}

// Per-locale cache. Bypassed in development so message edits show up without a restart.
const messagesCache = new Map<string, Promise<MessageTree>>();

function getMessages(locale: string): Promise<MessageTree> {
    if (process.env.NODE_ENV !== 'production') {
        return loadMessages(locale);
    }
    let pending = messagesCache.get(locale);
    if (!pending) {
        pending = loadMessages(locale).catch((error) => {
            messagesCache.delete(locale);
            throw error;
        });
        messagesCache.set(locale, pending);
    }
    return pending;
}

export default getRequestConfig(async ({requestLocale}) => {
    const requested = (await requestLocale) as string;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
    return {
        locale,
        messages: await getMessages(locale),
    };
});
