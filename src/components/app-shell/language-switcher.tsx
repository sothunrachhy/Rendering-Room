"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CambodiaFlag, UnitedKingdomFlag } from "@/components/app-shell/flags";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, LOCALE_NAMES, localePath, LOCALES, splitLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

const FLAGS: Record<Locale, typeof CambodiaFlag> = { en: UnitedKingdomFlag, km: CambodiaFlag };

// `!` because buttons and menu items force icons inside them to a 16px square,
// which would squash the 3:2 flags
const flagClass = "h-4! w-6! shrink-0 rounded-xs shadow-[0_0_0_1px_rgb(0_0_0/0.1)]";

/** Shows the current language's flag; opens a menu to switch. Keeps the page and filters. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const CurrentFlag = FLAGS[locale];

  function switchTo(target: Locale) {
    if (target === locale) return;
    // Read the URL at click time: usePathname() would block prerendering of dynamic routes
    const { path } = splitLocale(window.location.pathname);
    // Read the query string at click time; useSearchParams would force a Suspense boundary
    const href = localePath(target, path) + window.location.search;
    startTransition(() => router.push(href, { scroll: false }));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn("gap-1 px-2", pending && "opacity-60", className)}
            aria-label={`${t("language.label")}: ${LOCALE_NAMES[locale]}`}
          />
        }
      >
        <CurrentFlag className={flagClass} />
        <span className="hidden text-sm font-medium sm:inline">{LOCALE_NAMES[locale]}</span>
        {/* Phones: just the flag, the header is full */}
        <ChevronDown className="text-muted-foreground hidden size-3.5 sm:block" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => switchTo(value as Locale)}>
          {LOCALES.map((option) => {
            const Flag = FLAGS[option];
            return (
              <DropdownMenuRadioItem closeOnClick key={option} value={option} lang={option}>
                <Flag className={flagClass} />
                {LOCALE_NAMES[option]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
