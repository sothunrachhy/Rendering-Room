"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The round contact button in the corner. It appears once the hero search has scrolled
 * out of view, so it never sits on the search fields (QA 3 #9), on any screen size.
 */
export function FloatingContact({
  href,
  label,
  watchId,
}: {
  href: string;
  label: string;
  /** Id of the element (the hero search) it stays hidden over */
  watchId: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Hidden while the search is on screen or still below (page not scrolled yet)
      setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <Link
      href={href}
      aria-hidden={!shown || undefined}
      tabIndex={shown ? undefined : -1}
      className={cn(
        "bg-primary hover:bg-primary/90 fixed right-4 bottom-4 z-30 flex size-12 items-center justify-center rounded-full text-white shadow-xl ring-4 shadow-blue-900/30 ring-white transition duration-200 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-6 sm:bottom-6 sm:size-14 dark:bg-sky-500 dark:ring-slate-900",
        shown ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <MessageCircle className="size-6" aria-hidden />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
