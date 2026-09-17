import {cookies} from 'next/headers';

const AUTH_TOKEN_COOKIE = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';
const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function setAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
    });
}

export async function getAuthToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
}

export async function removeAuthToken() {
    const cookieStore = await cookies();
    cookieStore.delete({name: AUTH_TOKEN_COOKIE, path: '/'});
}

/**
 * Only accept same-site relative paths as post-login redirect targets.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.com`), backslash tricks
 * and anything that does not start with a single `/`.
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
    if (!path || typeof path !== 'string') return false;
    if (!path.startsWith('/')) return false;
    if (path.startsWith('//') || path.startsWith('/\\')) return false;
    if (/[\r\n]/.test(path)) return false;
    if (/^\/[a-z][a-z0-9+.-]*:/i.test(path)) return false;
    return true;
}

/**
 * Returns the given redirect path when it is a safe same-site relative path,
 * otherwise the supplied fallback.
 */
export function getSafeRedirectPath(path: string | string[] | null | undefined, fallback = '/'): string {
    const candidate = Array.isArray(path) ? path[0] : path;
    return isSafeRedirectPath(candidate) ? candidate : fallback;
}
