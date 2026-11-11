// Light or dark, saved in localStorage once the visitor clicks the toggle; light until
// then. An inline script in <head> applies it before first paint, so dark-mode users
// get no light flash; see node_modules/next/dist/docs/.../preventing-flash-before-hydration.md

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Runs during HTML parsing. Keep in sync with applyTheme() below. */
export const themeScript = `(function(){
  var d;try{d=localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"}catch(e){}
  var r=document.documentElement;r.classList.toggle("dark",!!d);r.style.colorScheme=d?"dark":"light";
})()`;

export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme = readTheme()): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}
