"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/app-shell/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/db/schema";
import { useI18n } from "@/i18n/client";
import { HOME_PATHS } from "@/lib/roles";
import { NavLinks } from "./nav-links";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const { t, path } = useI18n();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu />
        <span className="sr-only">{t("nav.openMenu")}</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <SheetHeader className="p-0 pb-4">
          {/* Names the panel for screen readers; the logo is shown instead */}
          <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
          <Logo href={path(HOME_PATHS[role])} />
        </SheetHeader>
        <NavLinks role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
