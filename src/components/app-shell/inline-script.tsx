"use client";

/**
 * A <script> that runs during HTML parsing but doesn't make React warn when it
 * re-renders on the client (e.g. switching language re-renders the root layout).
 * Server HTML gets a runnable script; the browser render marks it as plain data.
 * Pattern from node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
