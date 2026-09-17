'use client';

import {use, useEffect, useRef, useState} from 'react';
import {VerifyResult, type VerifyResultType} from './verify-result';
import {verifyAccountAction} from './actions';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import {Loader2, XCircle} from 'lucide-react';
import {useTranslations} from 'next-intl';

interface VerifyContentProps {
    searchParams: Promise<{ token?: string }>;
}

export function VerifyContent({searchParams}: VerifyContentProps) {
    const t = useTranslations('Verify');
    const params = use(searchParams);
    const token = params.token;

    const [result, setResult] = useState<VerifyResultType | null>(null);
    // The verification token is single-use: guard against React StrictMode
    // double-invoking the effect in development.
    const startedRef = useRef(false);

    useEffect(() => {
        if (!token || startedRef.current) return;
        startedRef.current = true;

        let cancelled = false;
        verifyAccountAction(token).then((res) => {
            if (!cancelled) setResult(res);
        });

        return () => {
            cancelled = true;
        };
    }, [token]);

    if (!token) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-center">
                        <XCircle className="h-16 w-16 text-destructive"/>
                    </div>
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold">{t('invalidLink')}</h1>
                        <p className="text-muted-foreground">
                            {t('invalidLinkMessage')}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link href="/register" className="block">
                            <Button variant="outline" className="w-full">
                                {t('createNewAccount')}
                            </Button>
                        </Link>
                        <Link href="/sign-in" className="block">
                            <Button variant="ghost" className="w-full">
                                {t('backToSignIn')}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!result) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-center">
                        <Loader2 className="h-16 w-16 text-primary animate-spin"/>
                    </div>
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold">{t('verifying')}</h1>
                        <p className="text-muted-foreground">
                            {t('verifyingMessage')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <VerifyResult result={result}/>;
}
