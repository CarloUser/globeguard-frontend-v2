'use server';

import {mutate} from '@/lib/vendure/api';
import {LoginMutation, LogoutMutation} from '@/lib/vendure/mutations';
import {getSafeRedirectPath, removeAuthToken, setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {revalidatePath} from 'next/cache';
import {getLocale, getTranslations} from 'next-intl/server';

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
    const t = await getTranslations('Errors');
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    const result = await mutate(LoginMutation, {
        username,
        password,
    }, { useAuthToken: true });

    const loginResult = result.data.login;

    if (loginResult.__typename !== 'CurrentUser') {
        if (loginResult.__typename === 'NotVerifiedError') {
            return { error: t('verifyEmailFirst') };
        }
        return { error: t('invalidCredentials') };
    }

    // Store the token in a cookie if returned
    if (result.token) {
        await setAuthToken(result.token);
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}`, 'layout');

    // Only same-site relative paths are accepted as redirect targets
    const safeRedirect = getSafeRedirectPath(redirectTo, '/');

    redirect({href: safeRedirect, locale});
}

export async function logoutAction() {
    // Send the session token so the Vendure session is actually invalidated
    // server-side, not just the browser cookie.
    try {
        await mutate(LogoutMutation, {}, {useAuthToken: true});
    } catch (error) {
        // The cookie is cleared regardless; an unreachable API must not turn logout into an error page.
        console.error('Logout: could not invalidate the Vendure session', error);
    } finally {
        await removeAuthToken();
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}`, 'layout');
    redirect({href: '/', locale});
}
