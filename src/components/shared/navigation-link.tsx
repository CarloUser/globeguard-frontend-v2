import NextLink from 'next/link';
import {getRouteLocale} from '@/i18n/server';
import {ComponentProps} from 'react';

type NavigationLinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
    href: string;
    locale?: string;
};

/**
 * Locale-aware link for server components.
 * Cached components should pass locale explicitly to avoid reading request headers.
 */
export async function NavigationLink({href, locale: explicitLocale, ...rest}: NavigationLinkProps) {
    const locale = explicitLocale ?? await getRouteLocale();
    const localizedHref = href === '/' ? `/${locale}` : `/${locale}${href}`;
    return <NextLink href={localizedHref} {...rest} />;
}