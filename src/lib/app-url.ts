/**
 * The site's public address, for links in emails. It comes from configuration,
 * never from the request: an attacker can fake the Host/Origin headers of their
 * own request, which would otherwise make a victim's reset email link to the
 * attacker's site (host header poisoning).
 */
export function appUrl(): string {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/+$/, "");

  // Set automatically on Vercel
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be set in production (it's used for links in emails)");
  }
  return "http://localhost:3000";
}

/**
 * Like appUrl(), but never throws: for metadata, the sitemap and robots.txt, where a
 * missing APP_URL should mean slightly worse links, not a broken page.
 */
export function siteUrl(): string {
  try {
    return appUrl();
  } catch {
    return "http://localhost:3000";
  }
}
