import {getRouteLocale} from '@/i18n/server';
import {getGlobeguardContent} from '@/content/globeguard';
import {NavbarLink} from '@/components/layout/navbar/navbar-link';

export async function NavbarCollections() {
    const locale = await getRouteLocale();
    const content = getGlobeguardContent(locale);

    return (
        <>
            {content.nav.map((item) => (
                <NavbarLink key={item.href} href={item.href}>{item.label}</NavbarLink>
            ))}
        </>
    );
}