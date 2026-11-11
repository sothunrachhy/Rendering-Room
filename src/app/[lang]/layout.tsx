import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import { InlineScript } from "@/components/app-shell/inline-script";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/client";
import { LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { siteUrl } from "@/lib/app-url";
import { themeScript } from "@/lib/theme";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Geist has no Khmer glyphs; the browser falls back to Kantumruy Pro for them.
const khmer = Kantumruy_Pro({
  variable: "--font-khmer",
  subsets: ["khmer"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Prerender every page in both languages
export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    // Turns relative image and page URLs in metadata into full ones, as Open Graph needs
    metadataBase: new URL(siteUrl()),
    title: { default: t("meta.appName"), template: `%s · ${t("meta.appName")}` },
    description: t("meta.description"),
    // What Telegram, Facebook and others show for a shared link. Pages override the
    // title, description and image where they have something better (e.g. a room).
    openGraph: {
      type: "website",
      siteName: t("meta.appName"),
      locale: locale === "km" ? "km_KH" : "en_US",
      title: t("meta.appName"),
      description: t("meta.description"),
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, dictionary } = await getI18n();

  return (
    // suppressHydrationWarning: the theme script adds the "dark" class before React hydrates
    <html
      lang={locale}
      className={`${geistSans.variable} ${khmer.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
          {/* Top centre, under the header: never covers buttons or cards at the bottom */}
          <Toaster richColors closeButton position="top-center" offset={72} />
        </I18nProvider>
      </body>
    </html>
  );
}
