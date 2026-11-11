"use client";

import { useEffect } from "react";

/**
 * Quietly swaps the address bar to `href` without reloading, e.g. after the search page
 * corrected invalid values, so the URL people copy matches what they see.
 */
export function ReplaceUrl({ href }: { href: string }) {
  useEffect(() => {
    if (window.location.pathname + window.location.search !== href) {
      window.history.replaceState(window.history.state, "", href);
    }
  }, [href]);
  return null;
}
