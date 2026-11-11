"use client";

import { List, Map as MapIcon } from "lucide-react";
import { useState } from "react";
import { RoomsMap } from "@/components/map/maps";
import { RoomCard } from "@/components/rooms/room-card";
import { useI18n } from "@/i18n/client";
import type { Point } from "@/lib/ranking";
import { cn } from "@/lib/utils";
import type { RankedRoom } from "@/server/queries/rooms";

/** Ranked rooms as cards next to a map. On phones, a toggle switches between them. */
export function SearchResults({
  rooms,
  campus,
  campusName,
  maxDistanceKm,
  query,
}: {
  rooms: RankedRoom[];
  campus: Point;
  campusName: string;
  maxDistanceKm: number;
  query: string;
}) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="grid gap-4">
      <div
        className="bg-muted grid w-fit grid-cols-2 gap-1 rounded-lg p-1 lg:hidden"
        role="group"
        aria-label={`${t("search.showList")} / ${t("search.showMap")}`}
      >
        {(["list", "map"] as const).map((value) => {
          const Icon = value === "list" ? List : MapIcon;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {value === "list" ? t("search.showList") : t("search.showMap")}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <ul
          className={cn(
            "grid content-start gap-4 sm:grid-cols-2",
            view === "map" && "hidden lg:grid",
          )}
        >
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCard
                room={room}
                campusName={campusName}
                query={query}
                active={room.id === activeId}
                onHover={setActiveId}
              />
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "h-[70svh] lg:sticky lg:top-4 lg:block lg:h-[calc(100svh-2rem)]",
            view === "list" && "hidden",
          )}
        >
          <RoomsMap
            campus={campus}
            campusName={campusName}
            maxDistanceKm={maxDistanceKm}
            rooms={rooms}
            activeId={activeId}
            onHover={setActiveId}
            query={query}
            className="glass size-full rounded-2xl border"
          />
        </div>
      </div>
    </div>
  );
}
