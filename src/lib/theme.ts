// Theme preference ("light" | "dark" | "system") lives in localStorage. An inline
// script in <head> applies it before first paint, so there's no light flash for
// dark-mode users; see node_modules/next/dist/docs/.../preventing-flash-before-hydration.md

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

/** Runs during HTML parsing. Keep in sync with applyTheme() below. */
export const themeScript = `(function(){
  function apply(){
    var t;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}
    var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
    var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";
  }
  apply();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",apply);
})()`;

export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme = readTheme()): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}
