import type {Metadata} from 'next';
import {HelpCircle, Mail, ShieldCheck} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

const supportTopics = [
    {key: 'sgw', href: '/support/sgw', icon: ShieldCheck},
    {key: 'faq', href: '/faq', icon: HelpCircle},
    {key: 'kontakt', href: '/kontakt', icon: Mail},
] as const;

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Support'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('title'),
        description: t('intro'),
        alternates: buildAlternates(locale, '/support'),
    };
}

export default async function SupportPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Support'});

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t('intro')}</p>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <div className="grid gap-3 md:grid-cols-3">
                        {supportTopics.map((topic) => {
                            const Icon = topic.icon;
                            return (
                                <Link
                                    key={topic.key}
                                    href={topic.href}
                                    className="rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-primary"
                                >
                                    <div className="flex gap-3">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
                                            <Icon className="size-5" />
                                        </span>
                                        <div>
                                            <h2 className="font-semibold text-foreground">{t(`topics.${topic.key}.title`)}</h2>
                                            <p className="mt-1 text-sm leading-6 text-slate-600">{t(`topics.${topic.key}.description`)}</p>
                                            <span className="mt-3 inline-flex text-sm font-semibold text-primary">{t('open')}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
        </main>
    );
}
