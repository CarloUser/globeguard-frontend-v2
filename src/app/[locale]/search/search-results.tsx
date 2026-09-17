import { Suspense } from "react";
import { getRouteLocale } from "@/i18n/server";
import { getActiveCurrencyCode } from "@/lib/currency-server";
import { FacetFilters } from "@/components/commerce/facet-filters";
import { ProductGridSkeleton } from "@/components/shared/product-grid-skeleton";
import { ProductGrid } from "@/components/commerce/product-grid";
import type { ProductViewMode } from "@/components/commerce/product-view-toggle";
import { buildSearchInput, getCurrentPage } from "@/lib/search-helpers";
import { query } from "@/lib/vendure/api";
import { SearchProductsQuery } from "@/lib/vendure/queries";

interface SearchResultsProps {
  searchParams: Promise<{
    page?: string;
    view?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export async function SearchResults({ searchParams }: SearchResultsProps) {
  const searchParamsResolved = await searchParams;
  const locale = await getRouteLocale();
  const currencyCode = await getActiveCurrencyCode();
  const page = getCurrentPage(searchParamsResolved);
  const viewMode: ProductViewMode =
    searchParamsResolved.view === "list" ? "list" : "grid";

  const productDataPromise = query(
    SearchProductsQuery,
    {
      input: buildSearchInput({ searchParams: searchParamsResolved }),
    },
    { languageCode: locale, currencyCode, fetch: { cache: "no-store" } },
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
      <aside className="lg:col-span-1">
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted" />}>
          <FacetFilters productDataPromise={productDataPromise} />
        </Suspense>
      </aside>

      <div className="lg:col-span-3">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid
            productDataPromise={productDataPromise}
            currentPage={page}
            take={12}
            viewMode={viewMode}
          />
        </Suspense>
      </div>
    </div>
  );
}
