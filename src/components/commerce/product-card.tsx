"use client";

import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price } from "@/components/commerce/price";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ProductVisual,
  getProductVisualKind,
  getProductVisualLabel,
} from "@/components/commerce/product-visual";
import { addToCart } from "@/app/[locale]/product/[slug]/actions";
import type { ProductViewMode } from "@/components/commerce/product-view-toggle";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: FragmentOf<typeof ProductCardFragment>;
  viewMode?: ProductViewMode;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getProductBlurb(name: string, description: string, label: string) {
  const text = stripHtml(description);
  if (text) return text;

  if (/adapter|cable|kabel|stecker|truma|obd/i.test(name)) {
    return "Adapter ecosystem for supported diagnostic workflows.";
  }

  if (/software|license|lizenz|sgw|gateway|update/i.test(name)) {
    return "Activation path for software, updates, or gateway functions.";
  }

  return `${label} for brand-level GlobeGuard diagnostics.`;
}

function isDigitalProduct(name: string) {
  return /software|license|lizenz|sgw|gateway|update|remote|support/i.test(
    name,
  );
}

type ProductPriceData = {
  priceWithTax:
    | { __typename: "SinglePrice"; value: number }
    | { __typename: "PriceRange"; min: number; max: number };
  currencyCode: string;
};

function getPrimaryPrice(product: ProductPriceData) {
  if (product.priceWithTax.__typename === "SinglePrice") {
    return product.priceWithTax.value;
  }

  if (product.priceWithTax.__typename === "PriceRange") {
    return product.priceWithTax.min;
  }

  return null;
}

function ProductPrice({ product }: { product: ProductPriceData }) {
  const t = useTranslations("Product");

  if (product.priceWithTax.__typename === "PriceRange") {
    const isRange = product.priceWithTax.min !== product.priceWithTax.max;
    return (
      <span>
        {isRange && (
          <span className="mr-1 text-xs font-normal text-slate-500">
            {t("from")}
          </span>
        )}
        <Price
          value={product.priceWithTax.min}
          currencyCode={product.currencyCode}
        />
      </span>
    );
  }

  if (product.priceWithTax.__typename === "SinglePrice") {
    return (
      <Price
        value={product.priceWithTax.value}
        currencyCode={product.currencyCode}
      />
    );
  }

  return null;
}

export function ProductCard({
  product: productProp,
  viewMode = "grid",
}: ProductCardProps) {
  const t = useTranslations("Product");
  const product = readFragment(ProductCardFragment, productProp);
  const visualKind = getProductVisualKind(product.productName);
  const visualLabel = getProductVisualLabel(visualKind);
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isAdded, setIsAdded] = useState(false);
  const asset = product.productVariantAsset || product.productAsset;
  const primaryPrice = getPrimaryPrice(product);
  const blurb = getProductBlurb(
    product.productName,
    product.description,
    visualLabel,
  );
  const stockLine = isDigitalProduct(product.productName)
    ? t("digitalStockLine")
    : t("stockLine");

  const handleAddToCart = () => {
    if (!product.productVariantId || isPending) return;

    startTransition(async () => {
      const result = await addToCart(product.productVariantId, quantity);
      if (result.success) {
        setIsAdded(true);
        toast.success(t("addedToCartMessage"), {
          description: t("addedToCartDescription", {
            name: product.productName,
          }),
        });
        setTimeout(() => setIsAdded(false), 1800);
      } else {
        toast.error(t("errorTitle"), {
          description: result.error || t("errorAddToCart"),
        });
      }
    });
  };

  if (viewMode === "list") {
    return (
      <article className="grid gap-4 border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 md:grid-cols-[170px_minmax(0,1fr)_220px] dark:border-white/10 dark:bg-white/5">
        <Link
          href={`/product/${product.slug}`}
          className="block overflow-hidden bg-white"
        >
          <ProductVisual
            name={product.productName}
            asset={asset}
            className="aspect-[4/3] border border-slate-100"
          />
        </Link>

        <div className="min-w-0 py-1">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primary">
            {visualLabel}
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="group/name inline-block"
          >
            <h3 className="text-base font-bold leading-6 text-[#101820] group-hover/name:text-primary dark:text-white">
              {product.productName}
            </h3>
          </Link>
          <dl className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="inline text-slate-400">
                {t("sku", { sku: "" }).replace(": ", "")}:{" "}
              </dt>
              <dd className="inline font-semibold">{product.sku}</dd>
            </div>
            {product.productVariantName !== product.productName && (
              <div>
                <dt className="inline text-slate-400">
                  {t("variant", { name: "" }).replace(": ", "")}:{" "}
                </dt>
                <dd className="inline font-semibold">
                  {product.productVariantName}
                </dd>
              </div>
            )}
            <div>
              <dt className="inline text-slate-400">
                {t("placement").split(":")[0]}:{" "}
              </dt>
              <dd className="inline font-semibold">Universal</dd>
            </div>
          </dl>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {blurb}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-1 dark:border-white/10">
          <div>
            <div className="text-xl font-extrabold text-[#101820] dark:text-white">
              <ProductPrice product={product} />
            </div>
            {primaryPrice !== null && (
              <p className="mt-1 text-[11px] text-slate-500">excl. VAT</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">
              <span className="mt-1.5 size-2 rounded-full bg-emerald-500" />
              <span>{stockLine}</span>
            </div>
            <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-2">
              <select
                aria-label={t("quantity")}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="h-10 rounded-sm border border-slate-200 bg-white px-2 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#087DAA] px-3 text-sm font-bold text-white transition-colors hover:bg-[#076b91] disabled:pointer-events-none disabled:opacity-70"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isAdded ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <ShoppingCart className="size-4" />
                )}
                {isPending
                  ? t("adding")
                  : isAdded
                    ? t("addedToCart")
                    : t("addToCart")}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex min-h-full flex-col border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/5">
      <Link
        href={`/product/${product.slug}`}
        className="relative block border-b border-slate-100 bg-white dark:border-white/10"
      >
        <div className="absolute left-3 top-3 z-10 bg-red-500 px-2 py-1 text-[10px] font-extrabold uppercase text-white">
          Catalog item
        </div>
        <ProductVisual
          name={product.productName}
          asset={asset}
          className="aspect-[4/3]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-primary">
          {visualLabel}
        </div>
        <Link href={`/product/${product.slug}`} className="group/name">
          <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-[#101820] group-hover/name:text-primary dark:text-white">
            {product.productName}
          </h3>
        </Link>

        <div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <p>
            <span className="text-slate-400">
              {t("sku", { sku: "" }).replace(": ", "")}:{" "}
            </span>
            <span className="font-semibold">{product.sku}</span>
          </p>
          <p>
            <span className="text-slate-400">
              {t("placement").split(":")[0]}:{" "}
            </span>
            <span className="font-semibold">Universal</span>
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">
          <span className="mt-1.5 size-2 rounded-full bg-emerald-500" />
          <span>{stockLine}</span>
        </div>

        <div className="mt-auto pt-5">
          <div className="text-xl font-extrabold text-[#101820] dark:text-white">
            <ProductPrice product={product} />
          </div>
          {primaryPrice !== null && (
            <p className="mt-1 text-[11px] text-slate-500">excl. VAT</p>
          )}

          <div className="mt-4 grid grid-cols-[58px_minmax(0,1fr)] gap-2">
            <select
              aria-label={t("quantity")}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-10 rounded-sm border border-slate-200 bg-white px-2 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isPending}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#087DAA] px-3 text-sm font-bold text-white transition-colors hover:bg-[#076b91] disabled:pointer-events-none disabled:opacity-70",
              )}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isAdded ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <ShoppingCart className="size-4" />
              )}
              {isPending
                ? t("adding")
                : isAdded
                  ? t("addedToCart")
                  : t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
