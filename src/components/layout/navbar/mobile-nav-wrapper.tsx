import {getTopCollections} from '@/lib/vendure/cached';
import {getGlobeguardContent} from '@/content/globeguard';
import {MobileNav} from '@/components/layout/navbar/mobile-nav';

export async function MobileNavWrapper({locale}: {locale: string}) {
    const collections = await getTopCollections(locale);
    const content = getGlobeguardContent(locale);

    return <MobileNav collections={collections} navLinks={content.nav} />;
}