"use client";

import { GraduationCap, House } from "lucide-react";
import { useActionState, useState } from "react";
import Link from "next/link";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { withLinks } from "@/i18n/with-links";
import { SubmitButton } from "@/components/forms/submit-button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { register } from "@/server/actions/auth";

type SignUpRole = "STUDENT" | "LANDLORD";

export function RegisterForm({ defaultRole = "STUDENT" }: { defaultRole?: SignUpRole }) {
  const { t, path } = useI18n();
  const [state, formAction] = useActionState(register, undefined);
  const [role, setRole] = useState<SignUpRole>(
    state?.values?.role === "LANDLORD" ? "LANDLORD" : defaultRole,
  );

  const roles = [
    {
      value: "STUDENT",
      icon: GraduationCap,
      label: t("auth.roleStudent"),
      hint: t("auth.roleStudentHint"),
    },
    {
      value: "LANDLORD",
      icon: House,
      label: t("auth.roleLandlord"),
      hint: t("auth.roleLandlordHint"),
    },
  ] as const;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={state?.message} />

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t("auth.role")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {roles.map(({ value, icon: Icon, label, hint }) => (
            <label
              key={value}
              className={cn(
                "has-focus-visible:ring-ring/50 flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-3",
                role === value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="sr-only"
                // Named by the visible, translated words, not the value (QA A-02)
                aria-labelledby={`role-${value}-label`}
                aria-describedby={`role-${value}-hint`}
              />
              <span id={`role-${value}-label`} className="flex items-center gap-2 font-medium">
                <Icon className={cn("size-4", role === value && "text-primary")} aria-hidden />
                {label}
              </span>
              <span id={`role-${value}-hint`} className="text-muted-foreground text-xs">
                {hint}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField
        label={t("auth.name")}
        name="name"
        autoComplete="name"
        required
        defaultValue={state?.values?.name}
        errors={state?.fieldErrors?.name}
      />
      <FormField
        label={t("auth.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
      />
      <FormField
        label={`${t("auth.phone")} · ${t("common.optional")}`}
        name="phone"
        type="tel"
        autoComplete="tel"
        // Landlords' numbers stay hidden until they accept; students' go with each request
        hint={role === "LANDLORD" ? t("auth.phoneHint") : t("auth.phoneHintStudent")}
        defaultValue={state?.values?.phone}
        errors={state?.fieldErrors?.phone}
      />
      <PasswordField
        label={t("auth.password")}
        name="password"
        autoComplete="new-password"
        hint={t("auth.passwordHint")}
        errors={state?.fieldErrors?.password}
      />
      {/* What signing up agrees to, with the pages to read (QA U-11) */}
      <p className="text-muted-foreground text-xs">
        {withLinks(t("auth.consent"), {
          terms: (
            <Link href={path("/terms")} className="text-foreground underline underline-offset-2">
              {t("auth.termsLink")}
            </Link>
          ),
          privacy: (
            <Link href={path("/privacy")} className="text-foreground underline underline-offset-2">
              {t("auth.privacyLink")}
            </Link>
          ),
        })}
      </p>
      <SubmitButton size="lg" className="w-full">
        {t("auth.registerButton")}
      </SubmitButton>
    </form>
  );
}
