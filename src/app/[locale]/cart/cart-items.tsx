import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Minus, Plus, X } from "lucide-react";
import { Price } from "@/components/commerce/price";
import { removeFromCart, adjustQuantity } from "./actions";
import { getTranslations } from "next-intl/server";
import {
  ProductVisual,
  getProductVisualKind,
  getProductVisualLabel,
} from "@/components/commerce/product-visual";

type ActiveOrder = {
  id: string;
  currencyCode: string;
  lines: Array<{
    id: string;
    quantity: number;
    unitPriceWithTax: number;
    linePriceWithTax: number;
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

function isDigitalLine(name: string) {
  return /software|license|lizenz|sgw|gateway|update|remote|support/i.test(
    name,
  );
}

export async function CartItems({
  activeOrder,
}: {
  activeOrder: ActiveOrder | null;
}) {
  const t = await getTranslations("Cart");

  if (!activeOrder || activeOrder.lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-3xl font-bold text-[#101820]">
            {t("empty")}
          </h1>
          <p className="mb-8 text-slate-600">{t("emptyMessage")}</p>
          <Button render={<Link href="/search" />} nativeButton={false}>
            {t("continueShopping")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[112px_minmax(0,1fr)_120px_132px_120px_40px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
          <span>{t("imageColumn")}</span>
          <span>{t("productColumn")}</span>
          <span className="text-right">{t("unitPrice")}</span>
          <span className="text-center">{t("quantity")}</span>
          <span className="text-right">{t("lineTotal")}</span>
          <span className="sr-only">{t("removeItem")}</span>
        </div>

        <div className="divide-y divide-slate-200">
          {activeOrder.lines.map((line) => {
            const productName = line.productVariant.product.name;
            const visualKind = getProductVisualKind(productName);
            const visualLabel = getProductVisualLabel(visualKind);
            const supportLine = isDigitalLine(productName)
              ? t("activationLine")
              : t("shippingLine");

            return (
              <div
                key={line.id}
                className="relative grid gap-4 p-4 md:grid-cols-[112px_minmax(0,1fr)_120px_132px_120px_40px] md:items-center md:p-5"
              >
                <Link
                  href={`/product/${line.productVariant.product.slug}`}
                  className="block h-24 w-28 overflow-hidden rounded-md border border-slate-200 bg-slate-50"
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
                    <ProductVisual
                      name={productName}
                      asset={line.productVariant.product.featuredAsset}
                      className="h-full w-full"
                    />
                  )}
                </Link>

                <div className="min-w-0 pr-10 md:pr-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {visualLabel}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="size-3.5" />
                      {supportLine}
                    </span>
                  </div>

                  <Link
                    href={`/product/${line.productVariant.product.slug}`}
                    className="block text-base font-bold leading-snug text-[#101820] hover:text-primary"
                  >
                    {productName}
                  </Link>
                  {line.productVariant.name !== productName && (
                    <p className="mt-1 text-sm text-slate-600">
                      {line.productVariant.name}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {t("sku", { sku: line.productVariant.sku })}
                  </p>
                </div>

                <div className="hidden text-right md:block">
                  <p className="font-semibold text-[#101820]">
                    <Price
                      value={line.unitPriceWithTax}
                      currencyCode={activeOrder.currencyCode}
                    />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{t("each")}</p>
                </div>

                <div className="flex items-center gap-3 md:justify-center">
                  <div className="flex items-center gap-1 border border-slate-200 bg-slate-50">
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
                        className="h-9 w-9 rounded-none hover:bg-white"
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
                        className="h-9 w-9 rounded-none hover:bg-white"
                        aria-label={t("increaseQuantity")}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 md:block md:text-right">
                  <div className="md:hidden">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("unitPrice")}
                    </p>
                    <p className="font-semibold">
                      <Price
                        value={line.unitPriceWithTax}
                        currencyCode={activeOrder.currencyCode}
                      />{" "}
                      {t("each")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:hidden">
                      {t("lineTotal")}
                    </p>
                    <p className="text-lg font-bold text-[#101820]">
                      <Price
                        value={line.linePriceWithTax}
                        currencyCode={activeOrder.currencyCode}
                      />
                    </p>
                  </div>
                </div>

                <form
                  action={async () => {
                    "use server";
                    await removeFromCart(line.id);
                  }}
                  className="absolute right-4 top-4 md:static"
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-slate-400 hover:bg-red-50 hover:text-destructive"
                    aria-label={t("removeItem")}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
