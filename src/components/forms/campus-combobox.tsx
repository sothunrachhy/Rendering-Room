"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { UniversityBadge } from "@/components/landing/university-badge";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { CampusOption } from "@/server/queries/rooms";

type CampusItem = { value: string; label: string; shortName: string; name: string };

/**
 * The university picker (QA 3 #1): type to filter ~25 campuses by short name or full
 * name, in either language. The list opens below the field and is wide enough for full
 * names. Submits `name` = the campus slug, like the old dropdown, so GET forms work
 * unchanged. Pair it with <label htmlFor={id}>: the input is a real <input>.
 */
export function CampusCombobox({
  id,
  name,
  campuses,
  defaultValue,
  className,
  inputClassName,
}: {
  id: string;
  name: string;
  campuses: CampusOption[];
  /** Campus slug selected at first */
  defaultValue: string;
  /** The box around input and chevron */
  className?: string;
  inputClassName?: string;
}) {
  const { locale, t } = useI18n();
  const items = useMemo<CampusItem[]>(
    () =>
      campuses.map((campus) => {
        const fullName = locale === "km" ? campus.nameKm : campus.name;
        return {
          value: campus.slug,
          // What the input shows once chosen, and what typing is matched against
          label: `${campus.shortName} · ${fullName}`,
          shortName: campus.shortName,
          name: fullName,
        };
      }),
    [campuses, locale],
  );
  const initial = items.find((item) => item.value === defaultValue) ?? items[0] ?? null;

  return (
    <Combobox.Root items={items} defaultValue={initial} name={name} autoHighlight>
      <Combobox.InputGroup className={cn("relative flex min-w-0 items-center", className)}>
        <Combobox.Input
          id={id}
          className={cn(
            "placeholder:text-muted-foreground w-full min-w-0 truncate bg-transparent pr-7 text-base outline-none sm:text-sm",
            inputClassName,
          )}
          // Select the text on focus so typing replaces it and filters at once
          onFocus={(event) => event.currentTarget.select()}
        />
        <Combobox.Trigger
          aria-label={t("search.showCampuses")}
          className="text-muted-foreground absolute right-0 flex h-full w-7 items-center justify-center"
        >
          <ChevronDown className="size-4" aria-hidden />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        {/* Always below the field (never flipped up over the heading); the list
            shrinks to the space below and scrolls */}
        <Combobox.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          collisionAvoidance={{ side: "none", align: "shift", fallbackAxisSide: "none" }}
          className="z-50"
        >
          <Combobox.Popup className="bg-popover text-popover-foreground ring-foreground/10 w-[max(var(--anchor-width),20rem)] max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-xl p-1 shadow-xl ring-1 transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Combobox.Empty className="text-muted-foreground px-3 py-3 text-sm empty:hidden">
              {t("search.noCampus")}
            </Combobox.Empty>
            <Combobox.List className="max-h-[min(20rem,max(10rem,var(--available-height)))] overflow-y-auto overscroll-contain outline-none">
              {(item: CampusItem) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="data-highlighted:bg-accent data-selected:text-primary flex cursor-default items-center gap-2 rounded-lg py-2 pr-2 pl-2.5 text-sm outline-none select-none"
                >
                  <UniversityBadge
                    slug={item.value}
                    shortName={item.shortName}
                    className="size-6 text-[0.48rem] tracking-tighter"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{item.shortName}</span>{" "}
                    <span className="text-muted-foreground">{item.name}</span>
                  </span>
                  <Combobox.ItemIndicator className="shrink-0">
                    <Check className="size-4" aria-hidden />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
