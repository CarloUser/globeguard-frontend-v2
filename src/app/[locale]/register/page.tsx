import type {Metadata} from 'next';
import {Suspense} from 'react';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import { RegistrationForm } from "./registration-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {buildAlternates, SITE_NAME} from "@/lib/metadata";
import {isSafeRedirectPath} from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    return {
        title: t('createAccount'),
        alternates: buildAlternates(locale, '/register'),
    };
}

function RegistrationFormSkeleton() {
    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-44 mx-auto" />
            </CardFooter>
        </Card>
    );
}

async function RegisterContent({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
    const resolvedParams = await searchParams;
    const rawRedirectTo = resolvedParams?.redirectTo;
    const candidate = Array.isArray(rawRedirectTo) ? rawRedirectTo[0] : rawRedirectTo;
    // Only same-site relative paths are accepted as redirect targets
    const redirectTo = isSafeRedirectPath(candidate) ? candidate : undefined;

    return <RegistrationForm redirectTo={redirectTo} />;
}

export default async function RegisterPage({searchParams}: PageProps<'/[locale]/register'>) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    const tCommon = await getTranslations({locale, namespace: 'Common'});

    return (
        <main id="main-content" className="flex min-h-[calc(100vh-4rem)] mt-16">
            {/* Branded panel - desktop only */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/70 items-center justify-center p-12 rounded-br-3xl">
                <div className="max-w-md text-primary-foreground space-y-6">
                    <h2 className="text-4xl font-bold tracking-tight">{SITE_NAME}</h2>
                    <p className="text-xl text-primary-foreground/80 leading-relaxed">
                        {tCommon('siteDescription')}
                    </p>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <p className="text-sm font-medium text-primary tracking-wider uppercase lg:hidden">{SITE_NAME}</p>
                        <h1 className="text-3xl font-bold">{t('createAccount')}</h1>
                        <p className="text-muted-foreground">
                            {t('signUpMessage')}
                        </p>
                    </div>
                    <Suspense fallback={<RegistrationFormSkeleton />}>
                        <RegisterContent searchParams={searchParams} />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
