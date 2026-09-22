import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getRouteLocale } from "@/i18n/server";
import { Button } from "@/components/ui/button";
import { Minus, Package, Plus } from "lucide-react";
import { Price } from "@/components/commerce/price";
import { RemoveLineButton } from "@/components/checkout/remove-line-button";
import { SelectionBadge } from "@/components/checkout/selection-badge";
import { adjustQuantity } from "./actions";
import { getTranslations } from "next-intl/server";

type ActiveOrder = {
  id: string;
  currencyCode: string;
  lines: Array<{
    id: string;
    quantity: number;
    /** NET unit price in minor units. */
    unitPrice: number;
    /** NET line total in minor units. */
    linePrice: number;
    /** Configurator selections (brand group / model year / ELITE Mixed brand groups). */
    customFields?: {
      selectedBrandGroupId?: string | null;
      selectedYear?: number | null;
      selectedBrandGroupIds?: string | null;
    } | null;
    productVariant: {
      id: string;
      name: string;
      sku: string;
      product: {
        name: string;
        slug: string;
        featuredAsset?: {
          preview: string;
        } | null;
      };
    };
  }>;
};

export async function CartItems({
  activeOrder,
}: {
  activeOrder: ActiveOrder | null;
}) {
  const locale = await getRouteLocale();
  const t = await getTranslations("Cart");
  const tCommon = await getTranslations("Common");

  if (!activeOrder || activeOrder.lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            {t("empty")}
          </h1>
          <p className="mb-8 text-muted-foreground">{t("emptyMessage")}</p>
          <Button render={<Link href="/search" />} nativeButton={false}>
            {t("continueShopping")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="hidden grid-cols-[112px_minmax(0,1fr)_120px_132px_120px_40px] border-b border-border bg-muted px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
          <span>{t("imageColumn")}</span>
          <span>{t("productColumn")}</span>
          <span className="text-right">{t("unitPrice")}</span>
          <span className="text-center">{t("quantity")}</span>
          <span className="text-right">{t("lineTotal")}</span>
          <span className="sr-only">{t("removeItem")}</span>
        </div>

        <div className="divide-y divide-border">
          {activeOrder.lines.map((line) => {
            const productName = line.productVariant.product.name;
            const productHref = `/products/${line.productVariant.product.slug}`;

            return (
              <div
                key={line.id}
                className="relative grid gap-4 p-4 md:grid-cols-[112px_minmax(0,1fr)_120px_132px_120px_40px] md:items-center md:p-5"
              >
                <Link
                  href={productHref}
                  className="block h-24 w-28 overflow-hidden rounded-md border border-border bg-muted"
                >
                  {line.productVariant.product.featuredAsset ? (
                    <Image
                      src={line.productVariant.product.featuredAsset.preview}
                      alt={line.productVariant.name}
                      width={112}
                      height={96}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Package className="size-8" strokeWidth={1.5} />
                    </span>
                  )}
                </Link>

                <div className="min-w-0 pr-10 md:pr-0">
                  <Link
                    href={productHref}
                    className="block text-base font-bold leading-snug text-foreground hover:text-primary"
                  >
                    {productName}
                  </Link>
                  {line.productVariant.name !== productName && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {line.productVariant.name}
                    </p>
                  )}
                  <SelectionBadge
                    selection={line.customFields}
                    locale={locale}
                    className="mt-1"
                  />
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {t("sku", { sku: line.productVariant.sku })}
                  </p>
                </div>

                <div className="hidden text-right md:block">
                  <p className="font-semibold text-foreground">
                    <Price
                      value={line.unitPrice}
                      currencyCode={activeOrder.currencyCode}
                    />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("each")} · {tCommon("exclVat")}
                  </p>
                </div>

                <div className="flex items-center gap-3 md:justify-center">
                  <div className="flex items-center gap-1 border border-border bg-muted">
                    <form
                      action={async () => {
                        "use server";
                        await adjustQuantity(
                          line.id,
                          Math.max(1, line.quantity - 1),
                        );
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-none hover:bg-background"
                        disabled={line.quantity <= 1}
                        aria-label={t("decreaseQuantity")}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </form>

                    <span className="w-10 text-center font-semibold tabular-nums">
                      {line.quantity}
                    </span>

                    <form
                      action={async () => {
                        "use server";
                        await adjustQuantity(line.id, line.quantity + 1);
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-none hover:bg-background"
                        aria-label={t("increaseQuantity")}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 md:block md:text-right">
                  <div className="md:hidden">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("unitPrice")}
                    </p>
                    <p className="font-semibold">
                      <Price
                        value={line.unitPrice}
                        currencyCode={activeOrder.currencyCode}
                      />{" "}
                      {t("each")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">
                      {t("lineTotal")}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      <Price
                        value={line.linePrice}
                        currencyCode={activeOrder.currencyCode}
                      />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tCommon("exclVat")}
                    </p>
                  </div>
                </div>

                {/* SGW unlock lines (SKU GG-SGW-*) ask for confirmation before removal. */}
                <div className="absolute right-4 top-4 md:static">
                  <RemoveLineButton
                    lineId={line.id}
                    sku={line.productVariant.sku}
                    label={t("removeItem")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
