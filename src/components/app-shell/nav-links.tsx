"use client";

import {
  Bookmark,
  CalendarClock,
  Flag,
  House,
  LayoutDashboard,
  type LucideIcon,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/db/schema";
import { useI18n } from "@/i18n/client";
import type { TranslationKey } from "@/i18n/translator";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  key: Extract<TranslationKey, `nav.${string}`>;
  icon: LucideIcon;
  /** Only highlight on this exact path, not on pages below it */
  exact?: boolean;
};

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/rooms", key: "nav.search", icon: Search },
    { href: "/saved", key: "nav.saved", icon: Bookmark },
    { href: "/requests", key: "nav.requests", icon: CalendarClock },
    { href: "/settings", key: "nav.settings", icon: Settings },
  ],
  LANDLORD: [
    { href: "/listings", key: "nav.listings", icon: House },
    { href: "/requests", key: "nav.requests", icon: CalendarClock },
    { href: "/settings", key: "nav.settings", icon: Settings },
  ],
  ADMIN: [
    { href: "/admin", key: "nav.admin", icon: LayoutDashboard, exact: true },
    { href: "/admin/landlords", key: "nav.adminLandlords", icon: ShieldCheck },
    { href: "/admin/listings", key: "nav.adminListings", icon: House },
    { href: "/admin/reports", key: "nav.adminReports", icon: Flag },
    { href: "/rooms", key: "nav.search", icon: Search },
    { href: "/settings", key: "nav.settings", icon: Settings },
  ],
};

export function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t, path } = useI18n();

  return (
    <nav className="grid gap-1" aria-label={t("nav.main")}>
      {NAV_ITEMS[role].map(({ href, key, icon: Icon, exact }) => {
        const localized = path(href);
        const active = pathname === localized || (!exact && pathname.startsWith(`${localized}/`));
        return (
          <Link
            key={href}
            href={localized}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
