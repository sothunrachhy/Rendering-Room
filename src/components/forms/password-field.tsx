"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";

/**
 * A password input that keeps what was typed after a failed submit and can be shown
 * as plain text (QA U-06). Controlled on purpose: React clears uncontrolled fields
 * after every form action, which made people retype the password after any error.
 */
export function PasswordField({
  label,
  name,
  autoComplete,
  hint,
  errors,
}: {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  errors?: string[];
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [shown, setShown] = useState(false);

  return (
    <FormField label={label} name={name} hint={hint} errors={errors}>
      {({ invalid }) => (
        <div className="relative">
          <Input
            id={name}
            name={name}
            type={shown ? "text" : "password"}
            autoComplete={autoComplete}
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${name}-error` : undefined}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md outline-none focus-visible:ring-3"
          >
            {shown ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
            {/* Text, not aria-label, so "Password" alone still finds just the input */}
            <span className="sr-only">
              {shown ? t("auth.hidePassword") : t("auth.showPassword")}
            </span>
          </button>
        </div>
      )}
    </FormField>
  );
}
