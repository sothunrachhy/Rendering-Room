import { cn } from "@/lib/utils";

/**
 * The moving background behind the pages: three soft glows drifting slowly (pure
 * CSS, see .aurora in globals.css). They stay still for visitors who prefer reduced
 * motion. Place it inside a `.marketing-backdrop` container.
 *
 * `fixed`: the glows stay in place while a long page scrolls over them.
 */
export function MarketingBackground({ fixed = false }: { fixed?: boolean }) {
  return (
    <div className={cn("aurora", fixed && "aurora-fixed")} aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}
