"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/db/schema";
import { useI18n } from "@/i18n/client";
import { logout } from "@/server/actions/auth";
import { NAV_ITEMS } from "./nav-links";

/** Up to two initials, letters only: a name full of symbols still gets a clean avatar. */
function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((part) => part.match(/\p{L}/u)?.[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return letters || "?";
}

export function UserMenu({ name, email, role }: { name: string; email: string; role: Role }) {
  const [pending, startTransition] = useTransition();
  const { t, path } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="bg-muted rounded-full" />}
      >
        <span className="text-xs font-semibold">{initials(name)}</span>
        <span className="sr-only">{t("nav.accountMenu")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid">
            <span className="text-foreground truncate">{name}</span>
            <span className="truncate font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Every page of this role, so Saved rooms and requests are one click away anywhere */}
        {NAV_ITEMS[role].map(({ href, key, icon: Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={path(href)} />}>
            <Icon />
            {t(key)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={() => startTransition(() => logout())}>
          <LogOut />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
