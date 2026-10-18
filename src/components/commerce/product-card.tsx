"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { FragmentOf, readFragment } from "@/graphql";
import { ProductCardFragment } from "@/lib/vendure/fragments";
import { Price, VatNote } from "@/components/commerce/price";
import type { ProductViewMode } from "@/components/commerce/product-view-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
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

type ProductPriceData = {
  price:
    | { __typename: "SinglePrice"; value: number }
    | { __typename: "PriceRange"; min: number; max: number };
  currencyCode: string;
};

/** NET price (minor units) in the visitor's display currency; ranges show the minimum. */
function ProductPrice({ product }: { product: ProductPriceData }) {
  const t = useTranslations("Product");

  if (product.price.__typename === "PriceRange") {
    const isRange = product.price.min !== product.price.max;
    return (
      <span>
        {isRange && (
          <span className="mr-1 text-xs font-normal text-muted-foreground">
            {t("from")}
          </span>
        )}
        <Price value={product.price.min} currencyCode={product.currencyCode} />
      </span>
    );
  }

  return (
    <Price value={product.price.value} currencyCode={product.currencyCode} />
  );
}

function ProductCardImage({
  name,
  asset,
  className,
}: {
  name: string;
  asset?: { preview: string } | null;
  className?: string;
}) {
  if (asset?.preview) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={asset.preview}
          alt={name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <Package className="size-8" strokeWidth={1.5} />
    </div>
  );
}

/**
 * Catalogue card (grid + list variants). Cards only link to the product page: device
 * tiers need configuration there, and every other product is added to the cart from
 * its product page as well.
 */
export function ProductCard({
  product: productProp,
  viewMode = "grid",
}: ProductCardProps) {
  const t = useTranslations("Product");
  const tCommon = useTranslations("Common");
  const product = readFragment(ProductCardFragment, productProp);
  const asset = product.productVariantAsset || product.productAsset;
  const productHref = `/products/${product.slug}`;
  const blurb = stripHtml(product.description);

  if (viewMode === "list") {
    return (
      <article className="grid gap-4 border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 md:grid-cols-[170px_minmax(0,1fr)_200px]">
        {/* Duplicate of the name link: one tab stop and one name per card */}
        <Link href={productHref} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
          <ProductCardImage
            name={product.productName}
            asset={asset}
            className="aspect-[4/3] border border-border"
          />
        </Link>

        <div className="min-w-0 py-1">
          <Link href={productHref} className="group/name inline-block">
            <h3 className="text-base font-bold leading-6 text-foreground group-hover/name:text-primary">
              {product.productName}
            </h3>
          </Link>
          <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
            <div>
              <dt className="inline">{tCommon("sku")}: </dt>
              <dd className="inline font-semibold text-foreground">
                {product.sku}
              </dd>
            </div>
            {product.productVariantName !== product.productName && (
              <div>
                <dt className="inline">{t("variant", { name: "" }).replace(/:\s*$/, "")}: </dt>
                <dd className="inline font-semibold text-foreground">
                  {product.productVariantName}
                </dd>
              </div>
            )}
          </dl>
          {blurb && (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {blurb}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-1">
          <div>
            <div className="text-xl font-extrabold text-foreground">
              <ProductPrice product={product} />
            </div>
            <VatNote className="mt-1 block text-[11px] text-muted-foreground" />
          </div>

          <Button
            render={<Link href={productHref} />}
            nativeButton={false}
            variant="outline"
            className="h-10 w-full rounded-md font-bold"
          >
            {t("viewProduct")}
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex min-h-full flex-col border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
      {/* Same target as the name link below: hidden from keyboard and screen readers so each card
          is one tab stop with a name (without an image this link had no text at all) */}
      <Link
        href={productHref}
        className="relative block border-b border-border"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductCardImage
          name={product.productName}
          asset={asset}
          className="aspect-[4/3]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={productHref} className="group/name">
          <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-foreground group-hover/name:text-primary">
            {product.productName}
          </h3>
        </Link>

        <p className="mt-3 text-sm text-muted-foreground">
          <span>{tCommon("sku")}: </span>
          <span className="font-semibold text-foreground">{product.sku}</span>
        </p>

        {blurb && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {blurb}
          </p>
        )}

        <div className="mt-auto pt-5">
          <div className="text-xl font-extrabold text-foreground">
            <ProductPrice product={product} />
          </div>
          <VatNote className="mt-1 block text-[11px] text-muted-foreground" />

          <Button
            render={<Link href={productHref} />}
            nativeButton={false}
            variant="outline"
            className="mt-4 h-10 w-full rounded-md font-bold"
          >
            {t("viewProduct")}
          </Button>
        </div>
      </div>
    </article>
  );
}
