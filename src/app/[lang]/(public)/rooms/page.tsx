import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/app-shell/empty-state";
import { SearchFilters } from "@/components/rooms/search-filters";
import { SearchResults } from "@/components/rooms/search-results";
import { MarketingBackground } from "@/components/landing/marketing-background";
import { ReplaceUrl } from "@/components/rooms/replace-url";
import { SiteFooter } from "@/components/app-shell/site-footer";
import { SiteHeader } from "@/components/app-shell/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { languageAlternates, localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatPrice } from "@/lib/money";
import { parseSearchFilters, SEARCH_DEFAULTS, searchQuery, searchWasAdjusted } from "@/lib/rooms";
import { getCampuses, searchRooms } from "@/server/queries/rooms";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return { title: t("search.title"), alternates: languageAlternates(locale, "/rooms") };
}

export default function SearchPage({ searchParams }: PageProps<"/[lang]/rooms">) {
  return (
    <div className="marketing-backdrop flex min-h-svh flex-col">
      <MarketingBackground fixed />
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Suspense fallback={<SearchSkeleton />}>
          <Search searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

async function Search({ searchParams }: Pick<PageProps<"/[lang]/rooms">, "searchParams">) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const filters = parseSearchFilters(params);
  const campuses = await getCampuses();
  // An unknown campus code falls back to the default (or the first campus)
  const campus =
    campuses.find((c) => c.slug === filters.campus) ??
    campuses.find((c) => c.slug === SEARCH_DEFAULTS.campus) ??
    campuses[0];

  if (!campus) {
    // Fresh database without the seed: nothing to search around yet
    return (
      <EmptyState icon={SearchX} title={t("search.noResultsTitle")} description="npm run db:seed" />
    );
  }

  const effective = { ...filters, campus: campus.slug };
  const rooms = await searchRooms(effective, campus);
  const campusName = campus.shortName;
  // The link asked for values we couldn't use: say what we used, and fix the URL
  const adjusted = searchWasAdjusted(params, effective);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t("search.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("search.howRanked")}</p>
      </div>

      <div className="glass rounded-2xl border p-4 sm:p-5">
        <SearchFilters filters={effective} campuses={campuses} />
      </div>

      {adjusted && (
        <>
          <p role="status" className="bg-muted rounded-lg px-3 py-2 text-sm">
            {t("search.adjusted", {
              campus: campus.shortName,
              budget: formatPrice(effective.budget * 100, locale),
              km: effective.distance,
            })}
          </p>
          <ReplaceUrl href={`${localePath(locale, "/rooms")}${searchQuery(effective)}`} />
        </>
      )}

      <div className="grid gap-1">
        <h2 className="font-semibold" aria-live="polite">
          {t("search.results", { count: rooms.length })}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("search.resultsDescription", {
            km: effective.distance,
            campus: locale === "km" ? campus.nameKm : campus.name,
            budget: formatPrice(effective.budget * 100, locale),
          })}{" "}
          {t("search.budgetHint")}
        </p>
      </div>

      {rooms.length > 0 ? (
        <SearchResults
          rooms={rooms}
          campus={campus}
          campusName={campusName}
          maxDistanceKm={effective.distance}
          query={searchQuery({ campus: campus.slug })}
        />
      ) : (
        <EmptyState
          icon={SearchX}
          title={t("search.noResultsTitle")}
          description={t("search.noResultsDescription")}
        />
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
  );
}
