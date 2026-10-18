import { SearchTermSkeleton } from '@/app/[locale]/search/search-term';
import { SearchResultsSkeleton } from '@/components/shared/skeletons/search-results-skeleton';

export default function SearchLoading() {
    return (
        <main id="main-content" className="container mx-auto px-4 py-8 mt-16">
            <SearchTermSkeleton />
            <SearchResultsSkeleton />
        </main>
    );
}
