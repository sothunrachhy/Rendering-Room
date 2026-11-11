import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "@/components/app-shell/user-menu";
import { LanguageSwitcher } from "@/components/app-shell/language-switcher";
import { Logo } from "@/components/app-shell/logo";
import {
  MobileNav,
  MobileNavMenu,
  PublicNav,
  PublicNavLinks,
} from "@/components/app-shell/public-nav";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getOptionalUser } from "@/server/auth";
import { cn } from "@/lib/utils";

/**
 * Header of the public pages: full width and see-through, with a soft white curved
 * shape behind the logo and links. It scrolls away with the page (a see-through bar
 * can't sit over content). The theme toggle lives on the sign-in and account pages.
 */
export async function SiteHeader() {
  const { locale } = await getI18n();

  return (
    <header className="relative z-20">
      {/* The white shape. Desktop: from the screen's left edge to just past the links.
          Phones and tablets (no links in the bar): the full width, as a plain bar */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-b-3xl bg-white/90 shadow-[0_8px_30px_-12px_rgb(15_40_90/0.18)] backdrop-blur-sm lg:right-auto lg:w-[calc(50%+180px)] lg:min-w-[880px] lg:rounded-b-none lg:rounded-br-[72px] dark:bg-slate-900/80"
      />
      <div className="relative mx-auto flex h-20 w-full max-w-7xl items-center gap-1 px-4 sm:gap-2">
        <Logo
          href={localePath(locale, "/")}
          compactOnMobile
          subtitle="Phnom Penh"
          className="mr-2 text-lg lg:mr-6"
        />
        <Suspense fallback={<PublicNavLinks pathname={null} />}>
          <PublicNav />
        </Suspense>
        <div className="flex-1" />
        <LanguageSwitcher className="h-10 rounded-full bg-slate-100 px-3 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15" />
        <Suspense fallback={<Skeleton className="h-10 w-24 rounded-full" />}>
          <AccountArea />
        </Suspense>
        {/* On phones the links don't fit in the bar: they're in this menu */}
        <Suspense fallback={<MobileNavMenu pathname={null} />}>
          <MobileNav />
        </Suspense>
      </div>
    </header>
  );
}

async function AccountArea() {
  const [user, { locale, t }] = await Promise.all([getOptionalUser(), getI18n()]);

  if (user) return <UserMenu name={user.name} email={user.email} role={user.role} />;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={localePath(locale, "/login")}
        className={buttonVariants({
          variant: "ghost",
          className:
            "text-primary hover:text-primary h-10 bg-sky-100 px-4 font-semibold hover:bg-sky-200 sm:px-5 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25",
        })}
      >
        {t("nav.login")}
      </Link>
      <Link
        href={localePath(locale, "/register")}
        className={cn(
          buttonVariants(),
          "h-10 bg-blue-900 px-4 font-semibold text-white shadow-md shadow-blue-950/25 hover:bg-blue-950 sm:px-5 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300",
        )}
      >
        {t("nav.signup")}
      </Link>
    </div>
  );
}
