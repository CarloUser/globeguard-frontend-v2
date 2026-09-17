'use client';

import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {MAIN_NAV_ITEMS} from '@/components/layout/navbar/site-navigation';
import {cn} from '@/lib/utils';

function isActivePath(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Keyboard-accessible desktop main navigation built from the frozen route map.
 * Rendered from `lg` upwards; the mobile sheet (`MobileNav`) covers smaller viewports.
 */
export function MainNav({className}: {className?: string}) {
    const t = useTranslations('Navigation');
    const pathname = usePathname();

    return (
        <NavigationMenu className={cn('max-w-none justify-start', className)} aria-label={t('mainNavigation')}>
            <NavigationMenuList className="flex-wrap justify-start gap-1">
                {MAIN_NAV_ITEMS.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                        <NavigationMenuItem key={item.href}>
                            <NavigationMenuLink
                                render={<Link href={item.href} />}
                                active={active}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    'h-9 px-3 font-semibold text-foreground/80 hover:text-primary focus:text-primary',
                                    // Base UI renders active={true} as data-active="" (no value), so use the bare variant.
                                    'data-active:bg-muted data-active:text-primary',
                                )}
                            >
                                {t(item.key)}
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    );
                })}
            </NavigationMenuList>
        </NavigationMenu>
    );
}
