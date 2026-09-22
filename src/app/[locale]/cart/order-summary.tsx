import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, UserRound } from "lucide-react";
import { Price } from "@/components/commerce/price";
import { getTranslations } from "next-intl/server";

type ActiveOrder = {
  id: string;
  code: string;
  currencyCode: string;
  totalQuantity: number;
  /** NET subtotal in minor units. */
  subTotal: number;
  shippingWithTax: number;
  totalWithTax: number;
  taxSummary: Array<{
    description: string;
    taxRate: number;
    taxBase: number;
    taxTotal: number;
  }>;
  discounts?: Array<{
    description: string;
    /** NET discount amount in minor units. */
    amount: number;
    amountWithTax: number;
  }> | null;
};

/**
 * Cart summary: Zwischensumme (netto) = subTotal, MwSt. = sum of taxSummary.taxTotal,
 * Versand = shippingWithTax, Gesamt = totalWithTax. VAT depends on the delivery country
 * chosen at checkout (Cart.vatNote). Signed-out visitors see the account-required notice
 * (accounts are mandatory at checkout) with a sign-in link that returns to the checkout.
 */
export async function OrderSummary({
  activeOrder,
  isSignedIn,
}: {
  activeOrder: ActiveOrder;
  isSignedIn: boolean;
}) {
  const t = await getTranslations("Cart");
  const tPayment = await getTranslations("Payment");
  const vatTotal = activeOrder.taxSummary.reduce(
    (sum, entry) => sum + entry.taxTotal,
    0,
  );

  return (
    <div className="sticky top-24 rounded-md border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">
          {t("orderSummary")}
        </h2>
        <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          {activeOrder.code}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("items")}
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {t("itemCount", { count: activeOrder.totalQuantity })}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("orderCode")}
          </p>
          <p className="mt-1 font-mono text-xs font-semibold text-foreground">
            {activeOrder.code}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("subtotalNet")}</span>
          <span className="font-medium text-foreground">
            <Price
              value={activeOrder.subTotal}
              currencyCode={activeOrder.currencyCode}
            />
          </span>
        </div>
        {activeOrder.discounts && activeOrder.discounts.length > 0 && (
          <>
            {activeOrder.discounts.map((discount, index) => (
              <div
                key={index}
                className="flex justify-between gap-4 text-emerald-700"
              >
                <span>{discount.description}</span>
                <span>
                  <Price
                    value={discount.amount}
                    currencyCode={activeOrder.currencyCode}
                  />
                </span>
              </div>
            ))}
          </>
        )}
        {activeOrder.taxSummary.length > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t("vat")}</span>
            <span className="font-medium text-foreground">
              <Price
                value={vatTotal}
                currencyCode={activeOrder.currencyCode}
              />
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span className="text-right font-medium text-foreground">
            {activeOrder.shippingWithTax > 0 ? (
              <Price
                value={activeOrder.shippingWithTax}
                currencyCode={activeOrder.currencyCode}
              />
            ) : (
              t("calculatedAtCheckout")
            )}
          </span>
        </div>
      </div>

      <div className="my-5 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-4 font-bold">
          <span className="text-lg text-foreground">{t("total")}</span>
          <span className="text-3xl text-foreground">
            <Price
              value={activeOrder.totalWithTax}
              currencyCode={activeOrder.currencyCode}
            />
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("vatNote")}</p>
      </div>

      {!isSignedIn && (
        <Alert className="mb-4">
          <UserRound />
          <AlertDescription>
            {tPayment("accountRequired")}{" "}
            <Link
              href={`/sign-in?redirectTo=${encodeURIComponent("/checkout")}`}
              className="font-medium text-foreground underline underline-offset-3"
            >
              {tPayment("signInLink")}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Button
        render={<Link href="/checkout" />}
        nativeButton={false}
        className="h-12 w-full rounded-md text-base font-bold"
      >
        {t("proceedToCheckout")}
      </Button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>{t("secureCheckout")}</span>
      </div>

      <Button
        render={<Link href="/search" />}
        nativeButton={false}
        variant="outline"
        className="mt-5 h-11 w-full rounded-md"
      >
        {t("continueShopping")}
      </Button>
    </div>
  );
}
