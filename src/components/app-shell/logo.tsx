import Image from "next/image";
import Link from "next/link";
import mark from "@/assets/brand/uni-room-mark.png";
import { cn } from "@/lib/utils";

/** The Uni-Room mark: a navy map pin with a house, Angkor Wat and a gold swoosh. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={mark}
      alt=""
      priority
      sizes="48px"
      className={cn("h-12 w-auto shrink-0", className)}
    />
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
      {/* Brand name: the same in every language. "Uni-" navy, "Room" gold, as in the logo */}
      <span className={cn(compactOnMobile && "sr-only sm:not-sr-only")}>
        <span className="block leading-tight font-extrabold tracking-tight">
          <span className="text-[#0b2a5b] dark:text-white">Uni-</span>
          <span className="text-[#e3a83f]">Room</span>
        </span>
        {subtitle && (
          <span className="text-muted-foreground block text-xs leading-tight font-medium">
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
