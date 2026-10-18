import type {Metadata} from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {buildAlternates} from '@/lib/metadata';
import { ResetPasswordForm } from './reset-password-form';

// Was a hard-coded English title/description; now translated like the forgot-password page
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    return {
        title: t('resetPassword'),
        alternates: buildAlternates(locale, '/reset-password'),
    };
}

export default function ResetPasswordPage({searchParams}: PageProps<'/[locale]/reset-password'>) {
    return (
        <main id="main-content" className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto">
                <Suspense fallback={
                    <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                }>
                    <ResetPasswordForm searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
