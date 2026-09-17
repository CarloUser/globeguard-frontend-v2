import type { Metadata } from "next";
import { getRouteLocale } from "@/i18n/server";
import { getTranslations } from "next-intl/server";
import { Cart } from "@/app/[locale]/cart/cart";
import { Suspense } from "react";
import { CartSkeleton } from "@/components/shared/skeletons/cart-skeleton";
import { noIndexRobots } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRouteLocale();
  const t = await getTranslations({ locale, namespace: "Cart" });
  return {
    title: t("title"),
    robots: noIndexRobots(),
  };
}

export default async function CartPage() {
  const locale = await getRouteLocale();
  const t = await getTranslations({ locale, namespace: "Cart" });

  return (
    <div className="min-h-screen bg-[#f5f7fa] pt-8">
      <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#101820]">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {t("subtitle")}
          </p>
        </div>

        <Suspense fallback={<CartSkeleton />}>
          <Cart />
        </Suspense>
      </div>
    </div>
  );
}
