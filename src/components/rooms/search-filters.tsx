"use client";

import { MapPin, Route, Search, SlidersHorizontal, Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CampusCombobox } from "@/components/forms/campus-combobox";
import { FormSelect } from "@/components/forms/form-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { SORT_OPTIONS } from "@/lib/ranking";
import {
  DISTANCE_CHOICES,
  FACILITIES,
  GENDER_POLICIES,
  MAX_BUDGET,
  MIN_BUDGET,
  ROOM_TYPES,
  type SearchFilters as Filters,
} from "@/lib/rooms";
import type { CampusOption } from "@/server/queries/rooms";

/**
 * A plain GET form: the filters live in the URL, so results can be shared and the
 * back button works. It even works before JavaScript loads.
 */
export function SearchFilters({
  filters,
  campuses,
}: {
  filters: Filters;
  campuses: CampusOption[];
}) {
  const { t, path } = useI18n();
  const [budgetError, setBudgetError] = useState(false);
  const labelClass = "flex items-center gap-1.5";
  const extraCount = (filters.type ? 1 : 0) + (filters.gender ? 1 : 0) + filters.facilities.length;
  const distances = DISTANCE_CHOICES.includes(filters.distance as (typeof DISTANCE_CHOICES)[number])
    ? DISTANCE_CHOICES
    : [...DISTANCE_CHOICES, filters.distance].sort((a, b) => a - b);

  return (
    // noValidate: the browser's own error bubbles are always in English, and the
    // server already turns any odd value into a sensible one (see parseSearchFilters)
    <form
      action={path("/rooms")}
      method="get"
      className="grid gap-3"
      noValidate
      onSubmit={(event) => {
        // Our own, translated check (QA F-02): out-of-range rent says so instead of
        // being quietly changed by the server
        const budget = event.currentTarget.elements.namedItem("budget") as HTMLInputElement;
        const value = Number(budget.value);
        const ok = Number.isInteger(value) && value >= MIN_BUDGET && value <= MAX_BUDGET;
        setBudgetError(!ok);
        if (!ok) {
          event.preventDefault();
          budget.focus();
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor="campus" id="campus-label" className={labelClass}>
            <MapPin className="text-primary size-4" aria-hidden />
            {t("search.campus")}
          </Label>
          <CampusCombobox
            id="campus"
            name="campus"
            campuses={campuses}
            defaultValue={filters.campus}
            className="bg-background/60 hover:bg-background/90 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 h-8 rounded-lg border px-2.5 focus-within:ring-3"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="budget" className={labelClass}>
            <Tag className="text-primary size-4" aria-hidden />
            {t("search.budget")}
          </Label>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
              $
            </span>
            <Input
              id="budget"
              name="budget"
              type="number"
              inputMode="numeric"
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={1}
              defaultValue={filters.budget}
              className="pl-6"
              aria-invalid={budgetError || undefined}
              aria-describedby={budgetError ? "budget-error" : undefined}
              onInput={() => setBudgetError(false)}
            />
          </div>
          {budgetError && (
            <p id="budget-error" className="text-destructive text-xs" role="alert">
              {t("search.budgetRange")}
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="distance" id="distance-label" className={labelClass}>
            <Route className="text-primary size-4" aria-hidden />
            {t("search.distance")}
          </Label>
          <FormSelect
            id="distance"
            name="distance"
            defaultValue={String(filters.distance)}
            options={distances.map((km) => ({
              value: String(km),
              label: t("search.distanceValue", { km }),
            }))}
          />
        </div>
        <Button type="submit" className="sm:h-8">
          <Search aria-hidden />
          {t("search.submit")}
        </Button>
      </div>

      <details className="group rounded-lg border" open={extraCount > 0}>
        <summary className="hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium">
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("search.filters")}
          {extraCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
              {extraCount}
            </span>
          )}
        </summary>
        <div className="grid gap-4 border-t p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="type" id="type-label">
                {t("search.type")}
              </Label>
              <FormSelect
                id="type"
                name="type"
                submitOnChange
                defaultValue={filters.type ?? "any"}
                options={[
                  { value: "any", label: t("search.anyType") },
                  ...ROOM_TYPES.map((type) => ({ value: type, label: t(`roomTypes.${type}`) })),
                ]}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gender" id="gender-label">
                {t("search.gender")}
              </Label>
              <FormSelect
                id="gender"
                name="gender"
                submitOnChange
                defaultValue={filters.gender ?? "any"}
                options={[
                  { value: "any", label: t("search.anyGender") },
                  ...GENDER_POLICIES.filter((g) => g !== "ANY").map((gender) => ({
                    value: gender,
                    // "Open to women" includes rooms for anyone, which is what this filter returns
                    label: t(`search.genderOptions.${gender as "FEMALE" | "MALE"}`),
                  })),
                ]}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sort" id="sort-label">
                {t("search.sort")}
              </Label>
              <FormSelect
                id="sort"
                name="sort"
                submitOnChange
                defaultValue={filters.sort}
                options={SORT_OPTIONS.map((sort) => ({
                  value: sort,
                  label: t(`search.sortOptions.${sort}`),
                }))}
              />
            </div>
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t("search.facilities")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {FACILITIES.map((facility) => (
                <label key={facility} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="facilities"
                    value={facility}
                    defaultChecked={filters.facilities.includes(facility)}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    className="accent-primary size-4"
                  />
                  {t(`facilities.${facility}`)}
                </label>
              ))}
            </div>
          </fieldset>
          {/* Filters apply as soon as they change (QA U-07): one Search button, at the top */}
          <div>
            <Link href={path("/rooms")} className={buttonVariants({ variant: "ghost" })}>
              {t("search.clearFilters")}
            </Link>
          </div>
        </div>
      </details>
    </form>
  );
}
