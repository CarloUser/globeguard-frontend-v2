'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useSearchParams} from 'next/navigation';
import {useRouter, usePathname} from '@/i18n/navigation';
import {routing, localeNames} from '@/i18n/routing';
import {Check, Globe} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguagePicker() {
    const t = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleLocaleChange = (newLocale: string) => {
        // Keep the current query string (e.g. the picker's ?year=...&extraBrands=...) across the switch.
        router.replace({pathname, query: Object.fromEntries(searchParams.entries())}, {locale: newLocale});
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="w-8 gap-1.5 px-0 sm:w-auto sm:px-2.5" aria-label={t('switchLanguage')} />}>
                <Globe className="size-4" />
                <span className="hidden sm:inline">{localeNames[locale as keyof typeof localeNames] ?? locale.toUpperCase()}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {routing.locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                    >
                        <span>{localeNames[loc] ?? loc.toUpperCase()}</span>
                        {locale === loc && <Check className="ml-auto size-3" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
