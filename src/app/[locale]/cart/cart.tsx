import { CartItems } from "@/app/[locale]/cart/cart-items";
import { OrderSummary } from "@/app/[locale]/cart/order-summary";
import { PromotionCode } from "@/app/[locale]/cart/promotion-code";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getRouteLocale } from "@/i18n/server";
import { query } from "@/lib/vendure/api";
import { GetActiveOrderQuery } from "@/lib/vendure/queries";
import { getTranslations } from "next-intl/server";

export async function Cart() {
  const locale = await getRouteLocale();
  const t = await getTranslations("Cart");
  const { data } = await query(
    GetActiveOrderQuery,
    {},
    {
      useAuthToken: true,
      languageCode: locale,
    },
  );

  const activeOrder = data.activeOrder;

  if (!activeOrder || activeOrder.lines.length === 0) {
    return <CartItems activeOrder={null} />;
  }

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {t("reviewBeforeCheckout")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cartLineCount", { count: activeOrder.totalQuantity })}
          </p>
        </div>
        <Button
          render={<Link href="/search" />}
          nativeButton={false}
          variant="outline"
          className="h-10 rounded-md"
        >
          {t("continueShopping")}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        <CartItems activeOrder={activeOrder} />

        <div className="lg:col-span-1">
          <OrderSummary activeOrder={activeOrder} />
          <PromotionCode activeOrder={activeOrder} />
        </div>
      </div>
    </div>
  );
}
