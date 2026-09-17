'use client'

import {ComponentProps, useTransition} from "react";
import {logoutAction} from "@/app/[locale]/sign-in/actions";
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';

interface LoginButtonProps extends ComponentProps<'button'> {
    isLoggedIn: boolean;
}

export function LoginButton({isLoggedIn, children, onClick, ...props}: LoginButtonProps) {
    const t = useTranslations('Navigation');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <button {...props} aria-disabled={isPending}
                onClick={(event) => {
                    // Chain a handler merged in by a wrapper (e.g. SheetClose) before acting.
                    onClick?.(event);
                    if (isLoggedIn) {
                        startTransition(async () => {
                            await logoutAction()
                        })
                    } else {
                        router.push('/sign-in')
                    }
                }}>
            {children}
            {isLoggedIn ? t('signOut') : t('signIn')}
        </button>
    )
}