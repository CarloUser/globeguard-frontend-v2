import {getTranslations} from 'next-intl/server';
import {NavigationLink} from '@/components/shared/navigation-link';
import {globeguardCompany} from '@/content/globeguard';
import {GlobeguardBrand} from '@/components/layout/globeguard-brand';
import {
    FOOTER_INFORMATION_LINKS,
    FOOTER_LEGAL_LINKS,
    FOOTER_PRODUCT_LINKS,
    type SiteNavItem,
} from '@/components/layout/navbar/site-navigation';

const headingClassName = 'mb-4 text-sm font-bold uppercase tracking-wider text-accent';
const linkClassName = 'text-secondary-foreground/80 transition-colors hover:text-secondary-foreground';

async function FooterLinkColumn({
    title,
    items,
    locale,
    labels,
}: {
    title: string;
    items: readonly SiteNavItem[];
    locale: string;
    labels: (key: string) => string;
}) {
    return (
        <div>
            <h4 className={headingClassName}>{title}</h4>
            <ul className="space-y-2 text-sm">
                {items.map((item) => (
                    <li key={item.href}>
                        <NavigationLink locale={locale} href={item.href} className={linkClassName}>
                            {labels(item.key)}
                        </NavigationLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export async function Footer({locale}: {locale: string}) {
    const t = await getTranslations({locale, namespace: 'Footer'});
    const tNav = await getTranslations({locale, namespace: 'Navigation'});
    const {name, address, email} = globeguardCompany;
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-secondary-foreground/10 bg-secondary py-16 text-secondary-foreground">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <FooterLinkColumn title={t('products')} items={FOOTER_PRODUCT_LINKS} locale={locale} labels={tNav} />
                    <FooterLinkColumn title={t('information')} items={FOOTER_INFORMATION_LINKS} locale={locale} labels={tNav} />
                    <FooterLinkColumn title={t('legal')} items={FOOTER_LEGAL_LINKS} locale={locale} labels={tNav} />

                    <div>
                        <h4 className={headingClassName}>{t('contact')}</h4>
                        <address className="space-y-1 text-sm not-italic text-secondary-foreground/80">
                            <p className="font-semibold text-secondary-foreground">{name}</p>
                            <p>{address.street}</p>
                            <p>
                                {address.postalCode} {address.city}
                            </p>
                            <p>{address.country}</p>
                            <p>
                                <a href={`mailto:${email}`} className={linkClassName}>
                                    {email}
                                </a>
                            </p>
                        </address>
                    </div>
                </div>

                <div className="flex flex-col items-start justify-between gap-6 border-t border-secondary-foreground/10 pt-8 md:flex-row md:items-center">
                    <NavigationLink locale={locale} href="/">
                        <GlobeguardBrand compact className="brightness-0 invert" />
                    </NavigationLink>
                    <p className="text-xs text-secondary-foreground/70">{t('copyright', {year})}</p>
                </div>
            </div>
        </footer>
    );
}
