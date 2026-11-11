"use client";

import { GraduationCap, House, Info, LayoutGrid, type LucideIcon, Mail, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/client";
import type { TranslationKey } from "@/i18n/translator";
import { cn } from "@/lib/utils";

// `solid`: the icon still reads when filled in (the active page's icon is filled);
// icons with inner details (the "i", the envelope flap) get a light fill instead
const ITEMS: {
  href: string;
  key: TranslationKey;
  icon: LucideIcon;
  match?: string;
  solid?: boolean;
}[] = [
  { href: "/", key: "nav.home", icon: House, match: "/", solid: true },
  { href: "/rooms", key: "nav.browse", icon: LayoutGrid, match: "/rooms", solid: true },
  // The universities strip on the home page
  { href: "/#universities", key: "nav.nearUniversity", icon: GraduationCap, solid: true },
  { href: "/about", key: "nav.about", icon: Info, match: "/about" },
  // How to reach a person: the contact section of About
  { href: "/about#contact", key: "nav.contact", icon: Mail },
];

/** The public pages' main links, with the current page underlined. */
export function PublicNav() {
  const pathname = usePathname();
  return <PublicNavLinks pathname={pathname} />;
}

/** Same links without knowing the page: the prerendered fallback while PublicNav loads. */
export function PublicNavLinks({ pathname }: { pathname: string | null }) {
  const { t, path } = useI18n();

  return (
    <nav aria-label={t("nav.main")} className="hidden items-center gap-0.5 lg:flex xl:gap-1">
      {ITEMS.map(({ href, key, icon: Icon, match, solid }) => {
        const target = match && path(match);
        const active =
          pathname !== null &&
          target !== undefined &&
          (match === "/" ? pathname === target : pathname.startsWith(target!));
        return (
          <Link
            key={href}
            // "/#universities" → "/en#universities" (no slash, so no redirect drops the #)
            href={href.startsWith("/#") ? path("/") + href.slice(1) : path(href)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-10 items-center gap-2 rounded-full px-2.5 text-sm whitespace-nowrap transition-colors xl:px-3",
              "after:absolute after:inset-x-3 after:-bottom-2 after:h-1 after:rounded-full",
              active
                ? "text-primary after:bg-primary font-bold dark:text-sky-300 dark:after:bg-sky-300"
                : "text-foreground/80 hover:bg-muted/60 hover:text-foreground font-medium",
            )}
          >
            <Icon
              className={cn(
                "size-4",
                active && (solid ? "fill-current" : "fill-primary/20 dark:fill-sky-300/20"),
              )}
              aria-hidden
            />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phones and small tablets: the same links in a menu behind one button. */
export function MobileNav() {
  const pathname = usePathname();
  return <MobileNavMenu pathname={pathname} />;
}

/** The menu without knowing the page: the prerendered fallback while MobileNav loads. */
export function MobileNavMenu({ pathname }: { pathname: string | null }) {
  const { t, path } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="bg-slate-100 hover:bg-slate-200 lg:hidden dark:bg-white/10 dark:hover:bg-white/15"
          />
        }
      >
        <Menu aria-hidden />
        <span className="sr-only">{t("nav.openMenu")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {ITEMS.map(({ href, key, icon: Icon, match }) => {
          const target = match && path(match);
          // The current page, marked like the desktop nav (QA 3)
          const active =
            pathname !== null &&
            target !== undefined &&
            (match === "/" ? pathname === target : pathname.startsWith(target!));
          return (
            <DropdownMenuItem
              key={href}
              className={cn("h-10", active && "text-primary bg-primary/10 font-semibold")}
              render={
                <Link
                  href={href.startsWith("/#") ? path("/") + href.slice(1) : path(href)}
                  aria-current={active ? "page" : undefined}
                />
              }
            >
              <Icon className={cn(active && "text-primary")} />
              {t(key)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
