import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Loader2} from 'lucide-react';
import {VerifyContent} from './verify-content';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {buildAlternates, noIndexRobots} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Verify'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
        alternates: buildAlternates(locale, '/verify'),
    };
}

async function VerifyLoading() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Verify'});
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

export default function VerifyPage({searchParams}: PageProps<'/[locale]/verify'>) {
    return (
        <main id="main-content" className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <Suspense fallback={<VerifyLoading/>}>
                    <VerifyContent searchParams={searchParams}/>
                </Suspense>
            </div>
        </main>
    );
}
