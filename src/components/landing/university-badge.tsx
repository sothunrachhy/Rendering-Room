import Image from "next/image";
import { universityLogo } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

// Fallback colours for campuses without a logo, picked from the slug so each keeps its own
const TONES = ["bg-blue-600", "bg-rose-600", "bg-emerald-600", "bg-amber-500", "bg-violet-600"];

/** A campus's logo in a white circle, or its initials when we have no logo. Decorative. */
export function UniversityBadge({
  slug,
  shortName,
  className,
}: {
  slug: string;
  shortName: string;
  className?: string;
}) {
  const logo = universityLogo(slug);

  if (logo) {
    return (
      <span
        aria-hidden
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 ring-1 ring-black/5",
          className,
        )}
      >
        <Image src={logo} alt="" width={80} height={80} className="size-full object-contain" />
      </span>
    );
  }

  const tone = TONES[[...slug].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold tracking-tight text-white",
        tone,
        className,
      )}
    >
      {shortName.slice(0, 4)}
    </span>
  );
}
