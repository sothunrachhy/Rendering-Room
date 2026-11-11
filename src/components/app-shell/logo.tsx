import Link from "next/link";
import { cn } from "@/lib/utils";

/** The RoomFinder mark: a blue map pin with a small house in it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={cn("h-9 w-auto shrink-0", className)} aria-hidden>
      <path
        d="M16 1.5C8.3 1.5 2.5 7.3 2.5 15c0 10.2 13.5 23.5 13.5 23.5S29.5 25.2 29.5 15C29.5 7.3 23.7 1.5 16 1.5Z"
        className="fill-blue-600 dark:fill-sky-400"
      />
      {/* A lighter left half gives the pin some depth */}
      <path
        d="M16 1.5C8.3 1.5 2.5 7.3 2.5 15c0 10.2 13.5 23.5 13.5 23.5Z"
        className="fill-sky-500 dark:fill-sky-300"
      />
      <path
        d="M9.5 15.8 16 10.2l6.5 5.6V23a1 1 0 0 1-1 1h-3.7v-4.6h-3.6V24h-3.7a1 1 0 0 1-1-1Z"
        fill="white"
      />
    </svg>
  );
}

export function Logo({
  href,
  className,
  compactOnMobile = false,
  subtitle,
}: {
  href: string;
  className?: string;
  /** Show only the icon below the sm breakpoint, where the header is crowded */
  compactOnMobile?: boolean;
  /** A small second line under the name, e.g. the city */
  subtitle?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2 font-bold whitespace-nowrap", className)}
    >
      <LogoMark />
      {/* Brand name: the same in every language */}
      <span
        className={cn(
          "text-[#0b2a5b] dark:text-white",
          compactOnMobile && "sr-only sm:not-sr-only",
        )}
      >
        <span className="block leading-tight">RoomFinder</span>
        {subtitle && (
          <span className="text-muted-foreground block text-xs leading-tight font-medium">
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
