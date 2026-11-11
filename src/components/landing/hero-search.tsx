"use client";

import { BedDouble, MapPin, Search, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { CampusCombobox } from "@/components/forms/campus-combobox";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { formatPrice } from "@/lib/money";
import { MAX_BUDGET, ROOM_TYPES, SEARCH_DEFAULTS } from "@/lib/rooms";
import type { CampusOption } from "@/server/queries/rooms";

// Rent ceilings offered on the home page; the search page takes any amount
const BUDGETS = [100, 150, 200, 300, 500] as const;

/**
 * The home page's search bar: university, room type and budget, then the results page.
 * A plain GET form, like the search page's, so it works before JavaScript loads.
 */
export function HeroSearch({ campuses }: { campuses: CampusOption[] }) {
  const { locale, t, path } = useI18n();

  return (
    <form
      action={path("/rooms")}
      method="get"
      // One row only on wide screens: below that the fields' labels don't fit beside the
      // button, so the button takes its own row
      className="grid gap-2 sm:grid-cols-3 xl:grid-cols-[1.15fr_1fr_1.15fr_auto] xl:items-stretch"
    >
      {/* The home page searches the usual walking/moto distance; the results page can widen it */}
      <input type="hidden" name="distance" value={SEARCH_DEFAULTS.distance} />
      <Field id="campus" icon={<MapPin />} label={t("landing.nearUniversity")}>
        <CampusCombobox
          id="campus"
          name="campus"
          campuses={campuses}
          defaultValue={SEARCH_DEFAULTS.campus}
          className="h-7"
          inputClassName="text-slate-600 dark:text-slate-300"
        />
      </Field>
      <Field id="type" icon={<BedDouble />} label={t("landing.roomType")}>
        <FormSelect
          id="type"
          name="type"
          defaultValue="any"
          className={fieldSelect}
          options={[
            { value: "any", label: t("search.anyType") },
            ...ROOM_TYPES.map((type) => ({ value: type, label: t(`roomTypes.${type}`) })),
          ]}
        />
      </Field>
      <Field id="budget" icon={<Wallet />} label={t("landing.budget")}>
        <FormSelect
          id="budget"
          name="budget"
          defaultValue="300"
          className={fieldSelect}
          options={[
            ...BUDGETS.map((amount) => ({
              value: String(amount),
              label: t("landing.upTo", { amount: formatPrice(amount * 100, locale) }),
            })),
            { value: String(MAX_BUDGET), label: t("landing.anyBudget") },
          ]}
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="bg-primary hover:bg-primary/90 h-auto min-h-12 px-5 text-base font-semibold text-white shadow-lg shadow-blue-700/30 sm:col-span-3 xl:col-span-1 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
      >
        <Search className="size-5" aria-hidden />
        {t("landing.searchButton")}
      </Button>
    </form>
  );
}

// The dropdown sits borderless inside its grey field box (the box draws the focus ring)
const fieldSelect =
  "h-7 border-0 bg-transparent px-0 text-slate-500 shadow-none hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:text-slate-400 dark:hover:bg-transparent";

function Field({
  id,
  icon,
  label,
  children,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="focus-within:ring-ring/40 grid min-w-0 gap-0.5 rounded-xl bg-slate-100 px-3 py-2 transition-colors focus-within:ring-3 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10">
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="[&_svg]:text-primary flex min-w-0 items-center gap-1.5 text-sm font-bold whitespace-nowrap text-[#0b2a5b] dark:text-white [&_svg]:size-4 dark:[&_svg]:text-sky-300"
      >
        {icon}
        <span className="truncate">{label}</span>
      </label>
      {children}
    </div>
  );
}
