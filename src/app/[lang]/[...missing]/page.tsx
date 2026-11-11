import { notFound } from "next/navigation";

// Any address under /en or /km that matches no page. Calling notFound() here, before
// anything streams, gives a real 404 status with the translated, branded 404 page
// (src/app/[lang]/not-found.tsx) instead of Next.js's plain default one.
//
// `instant = false`: this page always throws notFound(), so the development check
// that every page can render an instant static shell can never pass here and would
// log an error on every 404 (QA F-01). There's nothing to navigate to instantly.
export const instant = false;

export default function MissingPage() {
  notFound();
}
