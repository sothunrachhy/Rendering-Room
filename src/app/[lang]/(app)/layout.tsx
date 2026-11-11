import { Suspense } from "react";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { NavLinks } from "@/components/app-shell/nav-links";
import { UserMenu } from "@/components/app-shell/user-menu";
import { LanguageSwitcher } from "@/components/app-shell/language-switcher";
import { Logo } from "@/components/app-shell/logo";
import { MarketingBackground } from "@/components/landing/marketing-background";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifyEmailBanner } from "@/components/app-shell/verify-email-banner";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";

// The shell (sidebar, header) is static and prerenders instantly. The parts that
// depend on who is signed in (their menu items, their name) stream in behind <Suspense>.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getI18n();

  return (
    <div className="marketing-backdrop flex min-h-svh">
      <MarketingBackground fixed />
      <aside className="bg-background/60 border-foreground/5 sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 border-r p-4 backdrop-blur-md md:flex">
        <Logo href={localePath(locale, "/")} className="px-2" />
        <Suspense fallback={<NavSkeleton />}>
          <SidebarNav />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/70 border-foreground/5 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur-md md:px-8">
          <Suspense fallback={<Skeleton className="size-8 md:hidden" />}>
            <CurrentMobileNav />
          </Suspense>
          <div className="flex-1" />
          <LanguageSwitcher />
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
            <CurrentUserMenu />
          </Suspense>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">
          <Suspense>
            <VerifyEmailBanner className="mb-6" />
          </Suspense>
          {children}
        </main>
        <SiteFooter compact />
      </div>
    </div>
  );
}

async function SidebarNav() {
  const user = await getCurrentUser();
  return <NavLinks role={user.role} />;
}

async function CurrentMobileNav() {
  const user = await getCurrentUser();
  return <MobileNav role={user.role} />;
}

async function CurrentUserMenu() {
  const user = await getCurrentUser();
  return <UserMenu name={user.name} email={user.email} role={user.role} />;
}

function NavSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-9" />
      ))}
    </div>
  );
}
