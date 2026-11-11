import type { Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translator";
import { formatPrice } from "@/lib/money";
import { estimateMonthlyCost, TYPICAL_USAGE } from "@/lib/rooms";

type CostRoom = {
  rentCents: number;
  depositCents: number;
  otherFeesCents: number;
  otherFeesNote: string | null;
  electricityCentsPerKwh: number | null;
  waterCentsPerM3: number | null;
};

/** Every cost a student will pay, so nothing new comes up at the visit. */
export function CostBreakdown({
  room,
  t,
  locale,
}: {
  room: CostRoom;
  t: Translator;
  locale: Locale;
}) {
  const cost = estimateMonthlyCost(room);
  const price = (cents: number) => formatPrice(cents, locale);

  const rows: { label: string; detail?: string; amount: string }[] = [
    { label: t("costs.rent"), amount: price(cost.rent) },
    {
      label: t("costs.electricity"),
      detail:
        room.electricityCentsPerKwh === null
          ? undefined
          : t("costs.perKwh", { amount: price(room.electricityCentsPerKwh) }),
      amount:
        room.electricityCentsPerKwh === null ? t("costs.included") : `≈ ${price(cost.electricity)}`,
    },
    {
      label: t("costs.water"),
      detail:
        room.waterCentsPerM3 === null
          ? undefined
          : t("costs.perM3", { amount: price(room.waterCentsPerM3) }),
      amount: room.waterCentsPerM3 === null ? t("costs.included") : `≈ ${price(cost.water)}`,
    },
  ];
  if (room.otherFeesCents > 0) {
    rows.push({
      label: t("costs.other"),
      detail: room.otherFeesNote ?? undefined,
      amount: price(cost.other),
    });
  }

  return (
    <div className="grid gap-3">
      <dl className="grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3">
            <dt>
              {row.label}
              {row.detail && (
                <span className="text-muted-foreground block text-xs">{row.detail}</span>
              )}
            </dt>
            <dd className="font-medium tabular-nums">{row.amount}</dd>
          </div>
        ))}
        <div className="flex items-start justify-between gap-3 border-t pt-2 text-base">
          <dt className="font-semibold">{t("costs.total")}</dt>
          <dd className="font-semibold tabular-nums">≈ {price(cost.total)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">{t("costs.deposit")}</dt>
          <dd className="font-medium tabular-nums">{price(room.depositCents)}</dd>
        </div>
      </dl>
      {/* Only when there are bills to estimate (QA F-05) */}
      {(room.electricityCentsPerKwh !== null || room.waterCentsPerM3 !== null) && (
        <p className="text-muted-foreground text-xs">
          {t("costs.estimateNote", {
            kwh: TYPICAL_USAGE.electricityKwh,
            m3: TYPICAL_USAGE.waterM3,
          })}
        </p>
      )}
    </div>
  );
}
