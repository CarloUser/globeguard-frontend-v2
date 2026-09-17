import { ResultOf } from "@/graphql";
import { ProductCard } from "./product-card";
import { Pagination } from "@/components/shared/pagination";
import { SortDropdown } from "./sort-dropdown";
import { SearchProductsQuery } from "@/lib/vendure/queries";
import { getRouteLocale } from "@/i18n/server";
import { getTranslations } from "next-intl/server";
import {
  ProductViewToggle,
  type ProductViewMode,
} from "@/components/commerce/product-view-toggle";

interface ProductGridProps {
  productDataPromise: Promise<{
    data: ResultOf<typeof SearchProductsQuery>;
    token?: string;
  }>;
  currentPage: number;
  take: number;
  viewMode?: ProductViewMode;
}

export async function ProductGrid({
  productDataPromise,
  currentPage,
  take,
  viewMode = "grid",
}: ProductGridProps) {
  const locale = await getRouteLocale();
  const t = await getTranslations({ locale, namespace: "Product" });
  const result = await productDataPromise;

  const searchResult = result.data.search;
  const totalPages = Math.ceil(searchResult.totalItems / take);

  if (!searchResult.items.length) {
    return (
      <div className="rounded-sm border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        <p>{t("noProductsFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <ProductViewToggle
            value={viewMode}
            labels={{ grid: t("gridView"), list: t("listView") }}
          />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("productCount", { count: searchResult.totalItems })}
          </p>
        </div>
        <div className="flex items-center gap-3 md:justify-end">
          <SortDropdown />
        </div>
      </div>

      <div
        className={
          viewMode === "list"
            ? "space-y-3"
            : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {searchResult.items.map((product, i) => (
          <ProductCard
            key={"product-grid-item" + i}
            product={product}
            viewMode={viewMode}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </div>
  );
}
