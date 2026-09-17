import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react";
import { applyPromotionCode, removePromotionCode } from "./actions";
import { getTranslations } from "next-intl/server";

type ActiveOrder = {
  id: string;
  couponCodes?: string[] | null;
};

export async function PromotionCode({
  activeOrder,
}: {
  activeOrder: ActiveOrder;
}) {
  const t = await getTranslations("Cart");

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded bg-slate-100 p-2 text-primary">
          <Tag className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[#101820]">
            {t("promotionCode")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("enterDiscountCode")}
          </p>
        </div>
      </div>

      {activeOrder.couponCodes && activeOrder.couponCodes.length > 0 ? (
        <div className="space-y-2">
          {activeOrder.couponCodes.map((code) => (
            <div
              key={code}
              className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 p-3"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-700" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    {t("couponApplied")}
                  </p>
                  <p className="font-mono text-sm font-semibold text-emerald-900">
                    {code}
                  </p>
                </div>
              </div>
              <form action={removePromotionCode}>
                <input type="hidden" name="code" value={code} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:bg-red-50 hover:text-destructive"
                >
                  {t("remove")}
                </Button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <form action={applyPromotionCode} className="flex gap-2">
          <Input
            type="text"
            name="code"
            placeholder={t("enterCode")}
            className="h-11 flex-1 rounded-md"
            required
          />
          <Button type="submit" className="h-11 rounded-md">
            {t("apply")}
          </Button>
        </form>
      )}
    </div>
  );
}
