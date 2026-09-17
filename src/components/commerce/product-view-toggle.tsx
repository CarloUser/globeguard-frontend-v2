"use client";

import { Grid2X2, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ProductViewMode = "grid" | "list";

interface ProductViewToggleProps {
  value: ProductViewMode;
  labels: {
    grid: string;
    list: string;
  };
}

export function ProductViewToggle({ value, labels }: ProductViewToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = (nextView: ProductViewMode) => {
    const params = new URLSearchParams(searchParams);
    if (nextView === "grid") {
      params.delete("view");
    } else {
      params.set("view", nextView);
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div
      className="inline-flex rounded-sm border border-slate-200 bg-white p-1 shadow-sm"
      role="group"
      aria-label="Product display mode"
    >
      <button
        type="button"
        aria-pressed={value === "grid"}
        aria-label={labels.grid}
        title={labels.grid}
        onClick={() => setView("grid")}
        className={cn(
          "flex size-9 items-center justify-center rounded-[3px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          value === "grid" &&
            "bg-foreground text-white hover:bg-foreground hover:text-white",
        )}
      >
        <Grid2X2 className="size-4" />
      </button>
      <button
        type="button"
        aria-pressed={value === "list"}
        aria-label={labels.list}
        title={labels.list}
        onClick={() => setView("list")}
        className={cn(
          "flex size-9 items-center justify-center rounded-[3px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          value === "list" &&
            "bg-foreground text-white hover:bg-foreground hover:text-white",
        )}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}
