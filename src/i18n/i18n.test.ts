import { describe, expect, it } from "vitest";
import { localePath, negotiateLocale, splitLocale } from "./config";
import { dictionaries } from "./dictionaries";
import { createTranslator } from "./translator";

describe("negotiateLocale", () => {
  it.each([
    [null, "en"],
    ["", "en"],
    ["km-KH,km;q=0.9,en-US;q=0.8", "km"],
    ["en-US,en;q=0.9,km;q=0.8", "en"],
    ["fr-FR,km;q=0.5", "km"], // first supported language wins
    ["fr-FR,de;q=0.8", "en"], // nothing supported: default
    ["en;q=0.2,km;q=0.9", "km"], // order by q, not position
  ])("%j -> %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });
});

describe("locale paths", () => {
  it("prefixes paths", () => {
    expect(localePath("km", "/budgets")).toBe("/km/budgets");
    expect(localePath("en", "/")).toBe("/en");
  });

  it("splits the locale off a pathname", () => {
    expect(splitLocale("/km/budgets")).toEqual({ locale: "km", path: "/budgets" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/budgets")).toEqual({ locale: null, path: "/budgets" });
    expect(splitLocale("/fr/budgets")).toEqual({ locale: null, path: "/fr/budgets" });
  });
});

describe("translator", () => {
  const t = createTranslator(dictionaries.en, "en");
  const km = createTranslator(dictionaries.km, "km");

  it("looks up nested keys", () => {
    expect(t("nav.search")).toBe("Find a room");
    expect(km("nav.search")).toBe("ស្វែងរកបន្ទប់");
  });

  it("fills in placeholders", () => {
    expect(t("room.away", { distance: "1.2 km", campus: "RUPP" })).toBe("1.2 km from RUPP");
  });

  it("picks English plural forms", () => {
    expect(t("room.reviewCount", { count: 1 })).toBe("1 review");
    expect(t("room.reviewCount", { count: 3 })).toBe("3 reviews");
    expect(t("room.reviewCount", { count: 0 })).toBe("0 reviews");
  });

  it("has every English key in Khmer, and no untranslated copies", () => {
    const leaves = (value: unknown, prefix = ""): [string, string][] =>
      typeof value === "string"
        ? [[prefix, value]]
        : Object.entries(value as object).flatMap(([k, v]) =>
            leaves(v, prefix ? `${prefix}.${k}` : k),
          );
    const english = new Map(leaves(dictionaries.en));
    const khmer = new Map(leaves(dictionaries.km));

    expect([...khmer.keys()].sort()).toEqual([...english.keys()].sort());
    // Brand name is intentionally the same in both languages
    const untranslated = [...english].filter(
      ([key, text]) => khmer.get(key) === text && key !== "meta.appName",
    );
    expect(untranslated).toEqual([]);
  });
});

describe("home page heading", () => {
  it.each(Object.entries(dictionaries))("%s underlines the end of the highlighted line", (_, d) => {
    expect(d.landing.titleHighlight.endsWith(d.landing.titleUnderlined)).toBe(true);
  });
});
