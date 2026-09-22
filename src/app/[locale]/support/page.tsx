import type {Metadata} from 'next';
import {BookOpen, Car, HelpCircle, Mail, ShieldCheck, Wrench} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {SUPPORTED_BRANDS_PDF} from '@/components/support/downloads';
import {SupportTopicCard} from '@/components/support/support-topic-card';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {SITE_URL, buildAlternates} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'SupportHub'});

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title: t('seoTitle'),
        description: t('seoDescription'),
        alternates: buildAlternates(locale, '/support'),
    };
}

/**
 * Support hub: SGW compatibility, manuals & software (PDF for now), partner workshops,
 * supported brands, FAQ, plus a contact CTA. Copy ported from the previous storefront.
 */
export default async function SupportPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'SupportHub'});

    return (
        <main id="main-content" className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{t('intro')}</p>
                </div>
            </section>

            <section className="py-8">
                <div className="container mx-auto max-w-5xl px-4 lg:px-8">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <SupportTopicCard
                            icon={ShieldCheck}
                            title={t('topics.sgw.title')}
                            text={t('topics.sgw.text')}
                            action={
                                <Link href="/support/sgw" className="btn-primary text-sm">
                                    {t('topics.sgw.button')}
                                </Link>
                            }
                        />
                        <SupportTopicCard
                            icon={BookOpen}
                            title={t('topics.manuals.title')}
                            text={t('topics.manuals.text')}
                            action={
                                <a href={SUPPORTED_BRANDS_PDF} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                                    {t('topics.manuals.button')}
                                </a>
                            }
                            hint={t('topics.manuals.hint')}
                        />
                        <SupportTopicCard
                            icon={Car}
                            title={t('topics.brands.title')}
                            text={t('topics.brands.text')}
                            action={
                                <Link href="/unterstuetzte-marken" className="btn-primary text-sm">
                                    {t('topics.brands.button')}
                                </Link>
                            }
                        />
                        <SupportTopicCard
                            icon={Wrench}
                            title={t('topics.workshops.title')}
                            text={t('topics.workshops.text')}
                            action={
                                <Link href="/partner" className="btn-primary text-sm">
                                    {t('topics.workshops.button')}
                                </Link>
                            }
                        />
                        <SupportTopicCard
                            icon={HelpCircle}
                            title={t('topics.faq.title')}
                            text={t('topics.faq.text')}
                            action={
                                <Link href="/faq" className="btn-primary text-sm">
                                    {t('topics.faq.button')}
                                </Link>
                            }
                        />
                        <SupportTopicCard
                            icon={Mail}
                            title={t('contact.title')}
                            text={t('contact.text')}
                            action={
                                <Link href="/kontakt" className="btn-secondary text-sm">
                                    {t('contact.button')}
                                </Link>
                            }
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
