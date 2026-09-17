import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CircleCheck, CreditCard, FileText, Lock, Truck } from "lucide-react";
import { Price } from "@/components/commerce/price";
import { getTranslations } from "next-intl/server";

type ActiveOrder = {
  id: string;
  code: string;
  currencyCode: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  discounts?: Array<{
    description: string;
    amountWithTax: number;
  }> | null;
};

export async function OrderSummary({
  activeOrder,
}: {
  activeOrder: ActiveOrder;
}) {
  const t = await getTranslations("Cart");

  return (
    <div className="sticky top-24 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#101820]">
            {t("orderSummary")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("summarySubtitle")}</p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
          {activeOrder.code}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 border-y border-slate-200 py-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("items")}
          </p>
          <p className="mt-1 font-semibold text-[#101820]">
            {t("itemCount", { count: activeOrder.totalQuantity })}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("orderCode")}
          </p>
          <p className="mt-1 font-mono text-xs font-semibold text-[#101820]">
            {activeOrder.code}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-600">{t("subtotal")}</span>
          <span className="font-medium text-[#101820]">
            <Price
              value={activeOrder.subTotalWithTax}
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
                    value={discount.amountWithTax}
                    currencyCode={activeOrder.currencyCode}
                  />
                </span>
              </div>
            ))}
          </>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-slate-600">{t("shipping")}</span>
          <span className="text-right font-medium text-[#101820]">
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

      <div className="my-5 border-t border-slate-200 pt-5">
        <div className="flex items-baseline justify-between gap-4 font-bold">
          <span className="text-lg text-[#101820]">{t("total")}</span>
          <span className="text-3xl text-[#101820]">
            <Price
              value={activeOrder.totalWithTax}
              currencyCode={activeOrder.currencyCode}
            />
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{t("taxNote")}</p>
      </div>

      <Button
        render={<Link href="/checkout" />}
        nativeButton={false}
        className="btn-primary h-12 w-full rounded-md text-base font-bold"
      >
        {t("proceedToCheckout")}
      </Button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Lock className="h-3 w-3" />
        <span>{t("secureCheckout")}</span>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
        <div className="flex gap-3 text-sm text-slate-700">
          <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{t("deliveryNote")}</span>
        </div>
        <div className="flex gap-3 text-sm text-slate-700">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{t("supportNote")}</span>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          {t("paymentOptions")}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
            <CreditCard className="size-3.5" /> {t("paymentCard")}
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
            <FileText className="size-3.5" /> {t("paymentInvoice")}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("paymentOptionsBody")}</p>
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
