// Decides which price pins on the search map get a full "$120" label and which
// shrink to a dot, so labels never cover each other or the campus marker (QA U-02).
// Pure function on screen positions, so it's easy to test.

export type PinBox = { id: string; x: number; y: number; width: number; height: number };

type Rect = { left: number; top: number; right: number; bottom: number };

const GAP = 3; // px kept free between labels

function rectOf(box: { x: number; y: number; width: number; height: number }): Rect {
  return {
    left: box.x - box.width / 2 - GAP,
    top: box.y - box.height / 2 - GAP,
    right: box.x + box.width / 2 + GAP,
    bottom: box.y + box.height / 2 + GAP,
  };
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * Greedy placement in priority order (best match first): a pin keeps its label if it
 * doesn't overlap a label already placed or a reserved area (the campus marker).
 * Returns the ids that get a label; the rest are drawn as dots.
 */
export function labelledPins(
  pins: PinBox[],
  reserved: { x: number; y: number; width: number; height: number }[] = [],
): Set<string> {
  const placed: Rect[] = reserved.map(rectOf);
  const labelled = new Set<string>();
  for (const pin of pins) {
    const rect = rectOf(pin);
    if (placed.some((other) => overlaps(rect, other))) continue;
    placed.push(rect);
    labelled.add(pin.id);
  }
  return labelled;
}

export type PinOffset = { dx: number; dy: number };

/**
 * Like labelledPins, but a label that collides where it is first tries a spot next to its
 * point (above, below, right, left) before giving up and becoming a dot (QA 3 #7), so
 * nearby rooms still show their prices. Returns each labelled pin's offset in px from its
 * point; pins missing from the map are drawn as dots.
 */
export function placePins(
  pins: PinBox[],
  reserved: { x: number; y: number; width: number; height: number }[] = [],
): Map<string, PinOffset> {
  const placed: Rect[] = reserved.map(rectOf);
  const offsets = new Map<string, PinOffset>();
  for (const pin of pins) {
    const lift = pin.height + 6;
    const side = pin.width / 2 + 10;
    const candidates: PinOffset[] = [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -lift },
      { dx: 0, dy: lift },
      { dx: side, dy: 0 },
      { dx: -side, dy: 0 },
    ];
    for (const offset of candidates) {
      const rect = rectOf({ ...pin, x: pin.x + offset.dx, y: pin.y + offset.dy });
      if (placed.some((other) => overlaps(rect, other))) continue;
      placed.push(rect);
      // A moved label's point stays marked by a small dot: keep that clear too
      if (offset.dx !== 0 || offset.dy !== 0) {
        placed.push(rectOf({ x: pin.x, y: pin.y, width: 8, height: 8 }));
      }
      offsets.set(pin.id, offset);
      break;
    }
  }
  return offsets;
}

/** Rough width of a price pin in px: 12px semibold digits plus the pill's padding. */
export function priceLabelWidth(label: string): number {
  return label.length * 7.5 + 20;
}
