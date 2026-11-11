import { MarketingBackground } from "@/components/landing/marketing-background";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { SiteHeader } from "@/components/app-shell/site-header";
import { getI18n } from "@/i18n/server";
import type { TranslationKey } from "@/i18n/translator";

type Page = "about" | "privacy" | "terms";

const SECTIONS: Record<Page, readonly ("s1" | "s2" | "s3" | "s4" | "s5")[]> = {
  about: ["s1", "s2", "s3"],
  privacy: ["s1", "s2", "s3", "s4", "s5"],
  terms: ["s1", "s2", "s3", "s4", "s5"],
};

/** About, Privacy and Terms: a title, short sections from the dictionary, and contact. */
export async function LegalPage({ page }: { page: Page }) {
  const { t } = await getI18n();
  const contact = process.env.CONTACT_EMAIL;
  // The dictionary's sections have fixed keys; this keeps one template for all three pages
  // (about has fewer sections than the others, which TypeScript can't follow here)
  const key = (suffix: string) => `legal.${page}.${suffix}` as TranslationKey;

  return (
    <div className="marketing-backdrop flex min-h-svh flex-col">
      <MarketingBackground fixed />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <article className="glass grid gap-6 rounded-2xl border p-6 sm:p-10">
          <header className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{t(key("title"))}</h1>
            <p className="text-muted-foreground text-lg">{t(key("intro"))}</p>
          </header>
          {SECTIONS[page].map((section) => (
            <section key={section} className="grid gap-1.5">
              <h2 className="text-lg font-semibold">{t(key(`${section}.title`))}</h2>
              <p className="leading-relaxed">{t(key(`${section}.body`))}</p>
            </section>
          ))}
          <section id="contact" className="grid gap-1.5">
            <h2 className="text-lg font-semibold">{t("legal.contactTitle")}</h2>
            <p className="leading-relaxed">
              {contact
                ? t("legal.contactWithEmail", { email: contact })
                : t("legal.contactWithoutEmail")}
            </p>
          </section>
          <p className="text-muted-foreground border-t pt-4 text-xs">{t("legal.pilot")}</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
