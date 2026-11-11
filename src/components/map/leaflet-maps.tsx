"use client";

// Leaflet touches `window` when it loads, so this file is only ever imported through
// next/dynamic with ssr: false (see ./maps.tsx).

import L from "leaflet";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useI18n } from "@/i18n/client";
import { MAP_TILES } from "@/lib/map-tiles";
import { formatPrice } from "@/lib/money";
import { placePins, type PinOffset, priceLabelWidth } from "@/lib/pin-layout";
import type { Point } from "@/lib/ranking";

// The search radius and the room-to-campus line: drawn with a class so dark mode can
// give them a brighter colour (QA U-03; see .map-overlay in globals.css)
const OVERLAY = { className: "map-overlay", color: "#2563eb" } as const;

const GRADUATION_CAP = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
const HOUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

// Leaflet positions a marker by setting `transform` on the icon element, so our own
// styles (which also use transform to center the pin) go on an inner element.
const campusIcon = L.divIcon({
  className: "",
  html: `<div class="campus-pin">${GRADUATION_CAP}</div>`,
  iconSize: [0, 0],
});
const roomIcon = L.divIcon({
  className: "",
  html: `<div class="room-pin">${HOUSE}</div>`,
  iconSize: [0, 0],
});

/** A price label; moved off its point (dx, dy px) when that spot was taken, with a dot on the point. */
function priceIcon(label: string, active: boolean, offset: PinOffset = { dx: 0, dy: 0 }) {
  const moved = offset.dx !== 0 || offset.dy !== 0;
  return L.divIcon({
    className: "",
    html:
      (moved ? `<div class="price-anchor" data-active="${active}"></div>` : "") +
      `<div class="price-pin" data-active="${active}" style="--dx:${offset.dx}px;--dy:${offset.dy}px">${label}</div>`,
    iconSize: [0, 0],
  });
}

/** A pin with no room for its label: a dot, with the price in its popup. */
function dotIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="price-dot" data-active="${active}"></div>`,
    iconSize: [0, 0],
  });
}

function BaseMap({
  center,
  zoom,
  className,
  children,
}: {
  center: Point;
  zoom: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { locale } = useI18n();
  const tiles = MAP_TILES[locale];

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      // Half steps, so the search radius fills the map instead of jumping a whole level
      zoomSnap={0.5}
      scrollWheelZoom={false}
      className={className}
    >
      {/* key: switching language swaps the tile server */}
      <TileLayer key={locale} url={tiles.url} attribution={tiles.attribution} />
      <InvalidateOnResize />
      {children}
    </MapContainer>
  );
}

/**
 * Leaflet measures its container once. When the map starts hidden (the phone layout
 * shows the list first) or the layout changes, re-measure so tiles fill the space.
 */
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/**
 * Frames the whole search radius and every result (QA U-01). On a wide screen the
 * map's lower part can start below the bottom of the window (it sticks in place once
 * you scroll), so the fit leaves that hidden strip out and everything lands in the
 * part you can actually see.
 */
function FitSearch({ center, km, rooms }: { center: Point; km: number; rooms: Point[] }) {
  const map = useMap();
  // Re-fit when the search changes, not on every re-render
  const roomsKey = rooms.map((r) => `${r.lat},${r.lng}`).join(";");

  useEffect(() => {
    const bounds = L.latLng(center.lat, center.lng).toBounds(km * 2000);
    for (const room of rooms) bounds.extend([room.lat, room.lng]);

    const fit = () => {
      const container = map.getContainer();
      const rect = container.getBoundingClientRect();
      // A sticky map (desktop) comes fully into view as the list scrolls: fit the whole
      // map (QA 3 #7). Otherwise fit what's on screen now, above the fold (QA U-03).
      const sticky = getComputedStyle(container.parentElement ?? container).position === "sticky";
      const hiddenBelow = sticky ? 0 : Math.max(0, rect.bottom - window.innerHeight);
      // Never squeeze the fit into less than 40% of the map
      const bottom = Math.min(hiddenBelow, rect.height * 0.6) + 16;
      map.fitBounds(bounds, { paddingTopLeft: [16, 16], paddingBottomRight: [16, bottom] });
    };
    fit();
    // Again after a resize: a map that started hidden had no size to fit into
    map.on("resize", fit);
    return () => {
      map.off("resize", fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roomsKey stands for rooms
  }, [map, center.lat, center.lng, km, roomsKey]);
  return null;
}

/**
 * Which pins have room for a "$120" label at the current zoom; the others become dots
 * (QA U-02). The best-ranked rooms get labels first, the hovered one always, and the
 * campus marker is kept clear.
 */
function usePinLabels(
  rooms: MapRoom[],
  campus: Point,
  activeId: string | null,
  locale: "en" | "km",
) {
  const [labelled, setLabelled] = useState<Map<string, PinOffset>>(
    () => new Map(rooms.map((r) => [r.id, { dx: 0, dy: 0 }])),
  );
  const [map, setMap] = useState<L.Map | null>(null);

  const compute = useCallback(() => {
    if (!map) return;
    const ordered = activeId
      ? [...rooms.filter((r) => r.id === activeId), ...rooms.filter((r) => r.id !== activeId)]
      : rooms;
    const pins = ordered.map((room) => {
      const point = map.latLngToContainerPoint([room.lat, room.lng]);
      return {
        id: room.id,
        x: point.x,
        y: point.y,
        width: priceLabelWidth(formatPrice(room.rentCents, locale)),
        height: 22,
      };
    });
    const campusPoint = map.latLngToContainerPoint([campus.lat, campus.lng]);
    setLabelled(placePins(pins, [{ x: campusPoint.x, y: campusPoint.y, width: 34, height: 34 }]));
  }, [map, rooms, campus.lat, campus.lng, activeId, locale]);

  useEffect(() => {
    if (!map) return;
    // On the next frame, once the first fit has settled the zoom
    const frame = requestAnimationFrame(compute);
    map.on("zoomend moveend resize", compute);
    return () => {
      cancelAnimationFrame(frame);
      map.off("zoomend moveend resize", compute);
    };
  }, [map, compute]);

  return { labelled, setMap };
}

function MapHandle({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => onMap(map), [map, onMap]);
  return null;
}

export type MapRoom = Point & { id: string; title: string; rentCents: number };

/** Search results: the campus, the distance limit, and a price pin per room. */
export function RoomsMap({
  campus,
  campusName,
  maxDistanceKm,
  rooms,
  activeId,
  onHover,
  query,
  className,
}: {
  campus: Point;
  campusName: string;
  maxDistanceKm: number;
  rooms: MapRoom[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  query: string;
  className?: string;
}) {
  const { locale, path } = useI18n();
  const { labelled, setMap } = usePinLabels(rooms, campus, activeId, locale);

  return (
    <BaseMap center={campus} zoom={14} className={className}>
      <MapHandle onMap={setMap} />
      <FitSearch center={campus} km={maxDistanceKm} rooms={rooms} />
      <Circle
        center={[campus.lat, campus.lng]}
        radius={maxDistanceKm * 1000}
        pathOptions={{ ...OVERLAY, weight: 1.5, fillOpacity: 0.05, dashArray: "6 6" }}
      />
      {/* Above the pins: the campus is what every distance is measured from */}
      <Marker position={[campus.lat, campus.lng]} icon={campusIcon} zIndexOffset={500}>
        <Popup>{campusName}</Popup>
      </Marker>
      {rooms.map((room) => {
        const price = formatPrice(room.rentCents, locale);
        const active = room.id === activeId;
        return (
          <Marker
            key={room.id}
            position={[room.lat, room.lng]}
            icon={
              labelled.has(room.id)
                ? priceIcon(price, active, labelled.get(room.id))
                : dotIcon(active)
            }
            zIndexOffset={active ? 1000 : 0}
            title={`${price} · ${room.title}`}
            eventHandlers={{
              mouseover: () => onHover(room.id),
              mouseout: () => onHover(null),
            }}
          >
            <Popup>
              <span className="block font-semibold">{price}</span>
              <Link href={`${path(`/rooms/${room.id}`)}${query}`} className="font-medium underline">
                {room.title}
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </BaseMap>
  );
}

/** One room, its campus, and a straight line between them. */
export function RoomLocationMap({
  room,
  campus,
  campusName,
  className,
}: {
  room: Point;
  campus: Point | null;
  campusName?: string;
  className?: string;
}) {
  const bounds = useMemo(
    () =>
      campus
        ? L.latLngBounds([
            [room.lat, room.lng],
            [campus.lat, campus.lng],
          ])
        : null,
    [room.lat, room.lng, campus],
  );

  return (
    <BaseMap center={room} zoom={15} className={className}>
      {bounds && <FitBounds bounds={bounds} />}
      <Marker position={[room.lat, room.lng]} icon={roomIcon} />
      {campus && (
        <>
          <Marker position={[campus.lat, campus.lng]} icon={campusIcon}>
            {campusName && <Popup>{campusName}</Popup>}
          </Marker>
          <Polyline
            positions={[
              [room.lat, room.lng],
              [campus.lat, campus.lng],
            ]}
            pathOptions={{ ...OVERLAY, weight: 2, dashArray: "6 6" }}
          />
        </>
      )}
    </BaseMap>
  );
}

function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    fit();
    map.on("resize", fit);
    return () => {
      map.off("resize", fit);
    };
  }, [map, bounds]);
  return null;
}

/** For the listing form: click (or drag the pin) to choose where the room is. */
export function LocationPicker({
  value,
  fallbackCenter,
  onChange,
  className,
}: {
  value: Point | null;
  fallbackCenter: Point;
  onChange: (point: Point) => void;
  className?: string;
}) {
  return (
    <BaseMap center={value ?? fallbackCenter} zoom={15} className={className}>
      <ClickToPlace onChange={onChange} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={roomIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = (event.target as L.Marker).getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </BaseMap>
  );
}

function ClickToPlace({ onChange }: { onChange: (point: Point) => void }) {
  useMapEvents({
    click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}
