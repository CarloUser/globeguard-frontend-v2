'use client';

import {useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';

/**
 * Error boundary for every locale route. It renders inside the locale layout, so the
 * header/footer shell and next-intl messages stay available; a failing data fetch
 * (e.g. the shop API is down) shows a translated message with a retry instead of
 * Next's default "Application error" screen.
 */
export default function LocaleError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
    const t = useTranslations('Common');

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main id="main-content" className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-24 text-center">
            <h1 className="text-2xl font-bold text-foreground">{t('errorTitle')}</h1>
            <p className="mt-3 max-w-md text-muted-foreground">{t('errorBody')}</p>
            <Button className="mt-8" onClick={() => reset()}>
                {t('retry')}
            </Button>
        </main>
    );
}
