import NextLink from 'next/link';
import {getPathname} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';
import {getRouteLocale} from '@/i18n/server';
import {ComponentProps} from 'react';

type NavigationLinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
    href: string;
    locale?: string;
};

function toRoutingLocale(locale: string): Locale {
    return (routing.locales as readonly string[]).includes(locale) ? (locale as Locale) : routing.defaultLocale;
}

/**
 * Locale-aware link for server components.
 * Uses next-intl's `getPathname` so the locale prefix follows the routing config
 * (`localePrefix: 'as-needed'` leaves the default locale unprefixed).
 * Cached components should pass `locale` explicitly to avoid reading request headers.
 */
export async function NavigationLink({href, locale: explicitLocale, ...rest}: NavigationLinkProps) {
    const locale = toRoutingLocale(explicitLocale ?? (await getRouteLocale()));
    const localizedHref = getPathname({href, locale});
    return <NextLink href={localizedHref} {...rest} />;
}
