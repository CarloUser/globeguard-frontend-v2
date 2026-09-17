import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';

export default async function ProfileLoading() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('profile')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('manageAccountInfo')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('personalInformation')}</CardTitle>
                    <CardDescription>
                        {t('updatePersonalDetails')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">{t('firstName')}</p>
                        <Skeleton className="h-10 w-full"/>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">{t('lastName')}</p>
                        <Skeleton className="h-10 w-full"/>
                    </div>
                    <Skeleton className="h-10 w-40"/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('emailAddress')}</CardTitle>
                    <CardDescription>
                        {t('updateEmailDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32"/>
                        <Skeleton className="h-10 w-full"/>
                    </div>
                    <Skeleton className="h-10 w-40"/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('changePassword')}</CardTitle>
                    <CardDescription>
                        {t('changePasswordDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32"/>
                        <Skeleton className="h-10 w-full"/>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32"/>
                        <Skeleton className="h-10 w-full"/>
                    </div>
                    <Skeleton className="h-10 w-32"/>
                </CardContent>
            </Card>
        </div>
    );
}
