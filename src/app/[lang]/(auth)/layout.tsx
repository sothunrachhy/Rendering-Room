import { MarketingBackground } from "@/components/landing/marketing-background";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { SiteHeader } from "@/components/app-shell/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // The same header and backdrop as the public pages, so signing in feels like the same
  // site (QA 3 #10). The theme toggle lives on the account pages only.
  return (
    <div className="marketing-backdrop relative flex min-h-svh flex-col overflow-hidden">
      <MarketingBackground />
      <SiteHeader />
      {/* Anchored to the top, not centred: the card then stays put as error messages
          appear and disappear, so a click never lands in the wrong field (QA U-05).
          Taller fields and button, like the home page search (QA 3 #10) */}
      <main className="relative mx-auto w-full max-w-md flex-1 px-4 pt-10 pb-12 sm:pt-14 [&_[data-slot=button][type=submit]]:h-11 [&_[data-slot=button][type=submit]]:text-base [&_input:not([type=checkbox]):not([type=radio])]:h-11 [&_input:not([type=checkbox]):not([type=radio])]:px-3">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
