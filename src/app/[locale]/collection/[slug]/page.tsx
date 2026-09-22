import {permanentRedirect} from 'next/navigation';
import {getPathname} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';

/**
 * /collection/[slug] moved permanently to /produkte/kategorie/[slug] (frozen route map,
 * DECISIONS.md O1). Kept only as a 308 redirect so old links keep resolving.
 */

interface CollectionRedirectProps {
    params: Promise<{locale: string; slug: string}>;
}

export default async function CollectionRedirectPage({params}: CollectionRedirectProps) {
    const {slug} = await params;
    const locale = await getRouteLocale();
    permanentRedirect(getPathname({locale, href: `/produkte/kategorie/${slug}`}));
}
