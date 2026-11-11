"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormField, FormMessage } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useI18n } from "@/i18n/client";
import { login } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const { t, path } = useI18n();
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormMessage message={state?.message} />
      <input type="hidden" name="next" value={next ?? ""} />
      <FormField
        label={t("auth.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
      />
      <PasswordField
        label={t("auth.password")}
        name="password"
        autoComplete="current-password"
        errors={state?.fieldErrors?.password}
      />
      <Link
        href={path("/forgot-password")}
        className="text-muted-foreground -mt-2 justify-self-end text-sm underline-offset-4 hover:underline"
      >
        {t("auth.forgotLink")}
      </Link>
      <SubmitButton size="lg" className="w-full">
        {t("auth.loginButton")}
      </SubmitButton>
    </form>
  );
}
