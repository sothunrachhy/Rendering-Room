"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet needs `window`, so the maps only load in the browser. The skeleton keeps
// the layout from jumping while they do.
function MapSkeleton() {
  return <Skeleton className="size-full min-h-64 rounded-2xl" />;
}

export const RoomsMap = dynamic(() => import("./leaflet-maps").then((m) => m.RoomsMap), {
  ssr: false,
  loading: MapSkeleton,
});

export const RoomLocationMap = dynamic(
  () => import("./leaflet-maps").then((m) => m.RoomLocationMap),
  { ssr: false, loading: MapSkeleton },
);

export const LocationPicker = dynamic(
  () => import("./leaflet-maps").then((m) => m.LocationPicker),
  { ssr: false, loading: MapSkeleton },
);

export type { MapRoom } from "./leaflet-maps";
