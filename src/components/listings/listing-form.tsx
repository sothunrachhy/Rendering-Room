"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { LocationPicker } from "@/components/map/maps";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/forms/form-select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import type { FormState } from "@/lib/form-state";
import { centsToInput } from "@/lib/money";
import type { Point } from "@/lib/ranking";
import { DISTRICTS, FACILITIES, GENDER_POLICIES, ROOM_TYPES } from "@/lib/rooms";
import { saveRoom } from "@/server/actions/rooms";
import type { EditableRoom } from "@/server/queries/rooms";

/** Create or edit a room. Without `room`, it posts a new one. */
export function ListingForm({ room, mapCenter }: { room?: EditableRoom; mapCenter: Point }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveRoom(prev, formData);
    if (result?.ok) toast.success(result.message);
    return result;
  }, undefined);
  const [location, setLocation] = useState<Point | null>(
    room ? { lat: room.lat, lng: room.lng } : null,
  );

  const errors = state?.fieldErrors;
  // After a failed submit, show what was typed; otherwise the saved room
  const value = (field: string, saved: string | number | null | undefined) =>
    state?.values?.[field] ?? (saved === null || saved === undefined ? "" : String(saved));
  const money = (cents: number | null | undefined, emptyWhenZero = false) =>
    cents === null || cents === undefined || (emptyWhenZero && cents === 0)
      ? ""
      : centsToInput(cents);
  const checkedFacilities = state?.values?.facilities?.split(",") ?? room?.facilities ?? [];

  return (
    <form action={formAction} className="grid gap-6" noValidate>
      <FormMessage message={state?.ok ? undefined : state?.message} />
      {room && <input type="hidden" name="id" value={room.id} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("listingForm.sections.basics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField
            label={t("listingForm.title")}
            name="title"
            maxLength={80}
            placeholder={t("listingForm.titlePlaceholder")}
            defaultValue={value("title", room?.title)}
            errors={errors?.title}
          />
          <FormField
            label={t("listingForm.description")}
            name="description"
            errors={errors?.description}
          >
            {({ invalid }) => (
              <Textarea
                id="description"
                name="description"
                rows={5}
                maxLength={3000}
                placeholder={t("listingForm.descriptionPlaceholder")}
                defaultValue={value("description", room?.description)}
                aria-invalid={invalid || undefined}
              />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label={t("listingForm.type")} name="type" errors={errors?.type}>
              {({ invalid }) => (
                <FormSelect
                  // Remount after a failed submit so it shows what was submitted
                  key={state?.values?.type}
                  id="type"
                  name="type"
                  defaultValue={value("type", room?.type ?? "SINGLE")}
                  invalid={invalid}
                  describedBy="type-error"
                  options={ROOM_TYPES.map((type) => ({
                    value: type,
                    label: t(`roomTypes.${type}`),
                  }))}
                />
              )}
            </FormField>
            <FormField label={t("listingForm.gender")} name="gender" errors={errors?.gender}>
              {({ invalid }) => (
                <FormSelect
                  key={state?.values?.gender}
                  id="gender"
                  name="gender"
                  defaultValue={value("gender", room?.gender ?? "ANY")}
                  invalid={invalid}
                  describedBy="gender-error"
                  options={GENDER_POLICIES.map((gender) => ({
                    value: gender,
                    label: t(`genders.${gender}`),
                  }))}
                />
              )}
            </FormField>
            <FormField
              label={t("listingForm.occupants")}
              name="maxOccupants"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              defaultValue={value("maxOccupants", room?.maxOccupants ?? 1)}
              errors={errors?.maxOccupants}
            />
          </div>
          <FormField
            label={`${t("listingForm.size")} · ${t("common.optional")}`}
            name="sizeSqm"
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            className="sm:max-w-48"
            defaultValue={value("sizeSqm", room?.sizeSqm)}
            errors={errors?.sizeSqm}
          />
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t("listingForm.facilities")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FACILITIES.map((facility) => (
                <label key={facility} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="facilities"
                    value={facility}
                    defaultChecked={checkedFacilities.includes(facility)}
                    className="accent-primary size-4"
                  />
                  {t(`facilities.${facility}`)}
                </label>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("listingForm.sections.location")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <FormField
              label={t("listingForm.address")}
              name="address"
              maxLength={200}
              placeholder={t("listingForm.addressPlaceholder")}
              defaultValue={value("address", room?.address)}
              errors={errors?.address}
            />
            <FormField label={t("listingForm.district")} name="district" errors={errors?.district}>
              {({ invalid }) => (
                <FormSelect
                  key={state?.values?.district}
                  id="district"
                  name="district"
                  defaultValue={value("district", room?.district)}
                  placeholder={t("listingForm.chooseDistrict")}
                  invalid={invalid}
                  describedBy="district-error"
                  options={DISTRICTS.map((district) => ({ value: district, label: district }))}
                />
              )}
            </FormField>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("listingForm.pickLocation")}</p>
            <input type="hidden" name="lat" value={location?.lat ?? ""} />
            <input type="hidden" name="lng" value={location?.lng ?? ""} />
            <LocationPicker
              value={location}
              fallbackCenter={mapCenter}
              onChange={setLocation}
              className="h-72 w-full rounded-xl border"
            />
            {errors?.lat ? (
              <p className="text-destructive text-sm">{errors.lat[0]}</p>
            ) : (
              <p className="text-muted-foreground text-xs">{t("listingForm.locationHint")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("listingForm.sections.costs")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("listingForm.rent")}
            name="rentCents"
            inputMode="decimal"
            placeholder="120"
            defaultValue={value("rentCents", money(room?.rentCents))}
            errors={errors?.rentCents}
          />
          <FormField
            label={t("listingForm.deposit")}
            name="depositCents"
            inputMode="decimal"
            placeholder="0"
            defaultValue={value("depositCents", money(room?.depositCents, true))}
            errors={errors?.depositCents}
          />
          <FormField
            label={t("listingForm.electricity")}
            name="electricityCentsPerKwh"
            inputMode="decimal"
            placeholder="0.25"
            hint={t("listingForm.utilityHint")}
            defaultValue={value("electricityCentsPerKwh", money(room?.electricityCentsPerKwh))}
            errors={errors?.electricityCentsPerKwh}
          />
          <FormField
            label={t("listingForm.water")}
            name="waterCentsPerM3"
            inputMode="decimal"
            placeholder="0.50"
            hint={t("listingForm.utilityHint")}
            defaultValue={value("waterCentsPerM3", money(room?.waterCentsPerM3))}
            errors={errors?.waterCentsPerM3}
          />
          <FormField
            label={t("listingForm.otherFees")}
            name="otherFeesCents"
            inputMode="decimal"
            placeholder="0"
            defaultValue={value("otherFeesCents", money(room?.otherFeesCents, true))}
            errors={errors?.otherFeesCents}
          />
          <FormField
            label={t("listingForm.otherFeesNote")}
            name="otherFeesNote"
            maxLength={120}
            placeholder={t("listingForm.otherFeesNotePlaceholder")}
            defaultValue={value("otherFeesNote", room?.otherFeesNote)}
            errors={errors?.otherFeesNote}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton size="lg">
          {room ? t("common.saveChanges") : t("listingForm.create")}
        </SubmitButton>
      </div>
    </form>
  );
}
