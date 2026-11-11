"use client";

import { ArrowRight, ChevronUp, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UniversityBadge } from "@/components/landing/university-badge";
import { useI18n } from "@/i18n/client";
import { searchQuery } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import type { CampusOption } from "@/server/queries/rooms";

const COLLAPSED_COUNT = 4;

/**
 * The home page's universities: the first four in a pill-shaped bar (one row from 1280px;
 * title above the cards on smaller screens, so long Khmer names fit); "View all" opens
 * the bar into a grid of every campus. Each links to a search near that campus.
 */
export function UniversityStrip({ campuses }: { campuses: CampusOption[] }) {
  const { locale, t, path } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? campuses : campuses.slice(0, COLLAPSED_COUNT);
  const canExpand = campuses.length > COLLAPSED_COUNT;

  const toggle = canExpand && (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="university-list"
      onClick={() => setExpanded((open) => !open)}
      className="text-primary hover:text-primary flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full bg-sky-100 px-3.5 text-sm font-semibold transition-colors hover:bg-sky-200 xl:self-center dark:bg-sky-500/15 dark:text-sky-300"
    >
      {expanded ? t("landing.universities.showLess") : t("landing.universities.viewAll")}
      {expanded ? (
        <ChevronUp className="size-4" aria-hidden />
      ) : (
        <ArrowRight className="size-4" aria-hidden />
      )}
    </button>
  );

  return (
    <section
      id="universities"
      aria-labelledby="universities-title"
      className={cn(
        "relative z-10 -mt-14 flex scroll-mt-6 flex-col gap-3 rounded-[2rem] bg-white p-3 shadow-xl shadow-blue-950/10 sm:p-4 dark:bg-slate-900 dark:shadow-black/40",
        expanded
          ? "lg:p-6"
          : "xl:flex-row xl:items-center xl:gap-4 xl:rounded-full xl:py-2 xl:pr-3 xl:pl-5",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="universities-title" className="flex shrink-0 items-center gap-3 leading-tight">
          <span className="text-primary flex size-9 items-center justify-center rounded-full bg-blue-50 dark:bg-sky-500/15 dark:text-sky-300">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-bold text-[#0b2a5b] dark:text-white">
              {t("landing.universities.title")}
            </span>
            <span className="text-muted-foreground block text-xs">
              {t("landing.universities.subtitle")}
            </span>
          </span>
        </h2>
        {/* Open: the button sits beside the title, above the grid */}
        {expanded && toggle}
      </div>
      <ul
        id="university-list"
        className={cn(
          "grid flex-1 gap-2 sm:grid-cols-2",
          expanded ? "lg:grid-cols-4" : "lg:grid-cols-4 xl:flex",
        )}
      >
        {shown.map((campus) => (
          <li key={campus.id} className="min-w-0 xl:flex-1">
            <Link
              href={path(`/rooms${searchQuery({ campus: campus.slug })}`)}
              title={locale === "km" ? campus.nameKm : campus.name}
              className="flex h-full items-center gap-2.5 rounded-xl bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-100 transition-colors hover:bg-sky-50 hover:ring-sky-200 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
            >
              <UniversityBadge slug={campus.slug} shortName={campus.shortName} className="size-9" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#0b2a5b] dark:text-white">
                  {campus.shortName}
                </span>
                <span className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                  {locale === "km" ? campus.nameKm : campus.name}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!expanded && toggle}
    </section>
  );
}
