"use client";

import { useEffect } from "react";
import { InlineScript } from "@/components/app-shell/inline-script";
import { themeScript } from "@/lib/theme";

// When this page last reloaded itself, so a real, lasting error can't cause a reload loop
const RELOAD_KEY = "roomfinder:error-reload";
const RELOAD_GAP_MS = 15_000;

/**
 * Shown when a page fails badly enough to take the whole layout down. Almost always that's
 * a tab opened before the latest deploy asking for files that no longer exist, so it first
 * reloads the page once by itself, which fixes it. If the page fails again straight away,
 * it stays here with Reload and Home buttons. Next.js's own styles don't load here, so the
 * look is inline; it follows the visitor's light/dark choice. Both languages, since the
 * page can't tell which one failed.
 */
export default function GlobalError({ error }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last > RELOAD_GAP_MS) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    } catch {
      // Storage blocked (private mode): don't risk a loop, just show the buttons
    }
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
        <title>RoomFinder</title>
        <style>{`
          :root { color-scheme: light; --bg: #f5f7fc; --card: #fff; --text: #0f2d68; --muted: #5f5f5f; --btn: #1646a0; --btn-text: #fff; --line: #e2e8f0; }
          .dark { color-scheme: dark; --bg: #0b1120; --card: #0f172a; --text: #fff; --muted: #a3a3a3; --btn: #38bdf8; --btn-text: #020617; --line: rgb(255 255 255 / 0.12); }
          body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; background: var(--bg); color: var(--text); font-family: system-ui, "Segoe UI", "Noto Sans Khmer", sans-serif; }
          main { max-width: 26rem; width: 100%; background: var(--card); border: 1px solid var(--line); border-radius: 22px; padding: 28px 24px; text-align: center; box-shadow: 0 10px 30px rgb(16 45 104 / 0.08); }
          h1 { font-size: 1.25rem; margin: 0 0 4px; }
          p { color: var(--muted); margin: 0 0 4px; line-height: 1.5; }
          .actions { display: flex; gap: 8px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
          button { font: inherit; font-weight: 600; border-radius: 999px; padding: 10px 20px; cursor: pointer; }
          .primary { background: var(--btn); color: var(--btn-text); border: 0; }
          .secondary { background: transparent; color: var(--text); border: 1px solid var(--line); }
        `}</style>
      </head>
      <body>
        <main>
          <h1>This page couldn’t load</h1>
          <p>Reload to try again.</p>
          <p lang="km">ទំព័រនេះមិនអាចបើកបានទេ។ សូមផ្ទុកឡើងវិញ។</p>
          <div className="actions">
            <button type="button" className="primary" onClick={() => window.location.reload()}>
              Reload · ផ្ទុកឡើងវិញ
            </button>
            {/* A full page load, not the router that just failed */}
            <button
              type="button"
              className="secondary"
              onClick={() => window.location.assign(window.location.origin)}
            >
              Home · ទំព័រដើម
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
