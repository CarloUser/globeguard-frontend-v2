import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {ProductCard} from '@/components/commerce/product-card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {readFragment} from '@/graphql';
import {Link} from '@/i18n/navigation';
import {toOgLocale} from '@/i18n/locale-utils';
import {getRouteLocale} from '@/i18n/server';
import {SITE_NAME, SITE_URL, buildAlternates, buildOgImages, truncateDescription} from '@/lib/metadata';
import {getCollectionChildren, type CatalogCollection} from '@/lib/vendure/catalog';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {KNOWN_COLLECTION_KEYS, getCategoryListingSections} from './listing';

/**
 * /produkte/kategorie/[slug] — generic collection listing (accessories, services, software
 * updates and any other Vendure collection). Hierarchy nodes render one section per child
 * collection; leaf collections render their own products. Unknown slugs are a 404.
 */

interface CategoryPageProps {
    params: Promise<{locale: string; slug: string}>;
}

interface KnownCopy {
    title: string;
    description: string;
}

type Translator = Awaited<ReturnType<typeof getTranslations>>;

/** Page-owned copy for zubehoer / services / software-updates; `null` for every other collection. */
function knownCopy(t: Translator, slug: string): KnownCopy | null {
    const key = KNOWN_COLLECTION_KEYS[slug];
    if (!key || !t.has(`known.${key}.title`)) {
        return null;
    }
    return {title: t(`known.${key}.title`), description: t(`known.${key}.description`)};
}

/** Metadata must not throw on a backend outage; the page body reports the error instead. */
async function safeCollection(slug: string, locale: string): Promise<CatalogCollection | null> {
    try {
        return await getCollectionChildren(slug, locale);
    } catch {
        return null;
    }
}

export async function generateMetadata({params}: CategoryPageProps): Promise<Metadata> {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const [t, tProduct, collection] = await Promise.all([
        getTranslations({locale, namespace: 'Tiers.category'}),
        getTranslations({locale, namespace: 'Product'}),
        safeCollection(slug, locale),
    ]);

    if (!collection) {
        return {title: tProduct('collectionNotFound')};
    }

    const known = knownCopy(t, slug);
    const title = known?.title ?? collection.name;
    const description =
        known?.description ||
        truncateDescription(collection.description) ||
        tProduct('browseCollectionAt', {name: collection.name, siteName: SITE_NAME});
    const alternates = buildAlternates(locale, `/produkte/kategorie/${collection.slug}`);

    return {
        metadataBase: new URL(SITE_URL),
        // The layout title template appends the site name.
        title,
        description,
        alternates,
        openGraph: {
            title,
            description,
            type: 'website',
            locale: toOgLocale(locale),
            url: alternates.canonical,
            images: buildOgImages(collection.featuredAsset?.preview, title),
        },
    };
}

export default async function CategoryPage({params}: CategoryPageProps) {
    const {slug} = await params;
    const locale = await getRouteLocale();
    const collection = await getCollectionChildren(slug, locale);

    // No loading.tsx for this route: a Suspense boundary above the page would flush a 200 shell
    // before notFound() runs, turning unknown slugs into soft 404s (see [locale]/layout.tsx).
    if (!collection) {
        notFound();
    }

    const [t, tProduct, sections] = await Promise.all([
        getTranslations({locale, namespace: 'Tiers.category'}),
        getTranslations({locale, namespace: 'Product'}),
        getCategoryListingSections(collection, locale),
    ]);
    const known = knownCopy(t, slug);
    const title = known?.title ?? collection.name;
    const description = known?.description || truncateDescription(collection.description, 300);
    const showSectionTitles = sections.length > 1;

    return (
        <main className="bg-slate-50 pt-32">
            <section className="border-b border-slate-200 bg-white">
                <div className="container mx-auto max-w-6xl px-4 py-10 lg:px-8">
                    <Breadcrumb className="mb-6">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link href="/" />}>{tProduct('home')}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link href="/produkte" />}>{t('productsCrumb')}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
                    {description && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>}
                </div>
            </section>

            <section className="py-8 md:py-12">
                <div className="container mx-auto max-w-6xl space-y-10 px-4 lg:px-8">
                    {sections.length === 0 && (
                        <p className="rounded-md border border-slate-200 bg-white p-12 text-center text-slate-600">
                            {t('empty')}
                        </p>
                    )}

                    {sections.map((section) => (
                        <section key={section.slug} aria-labelledby={showSectionTitles ? `section-${section.slug}` : undefined}>
                            {showSectionTitles && (
                                <div className="mb-4 max-w-3xl">
                                    <h2 id={`section-${section.slug}`} className="text-2xl font-bold text-foreground">
                                        {section.title}
                                    </h2>
                                    {section.description && (
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {truncateDescription(section.description, 300)}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {section.items.map((item) => (
                                    <ProductCard key={readFragment(ProductCardFragment, item).productId} product={item} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </section>
        </main>
    );
}
