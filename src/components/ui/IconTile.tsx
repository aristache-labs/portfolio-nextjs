
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

const SIZES = {
  sm: "size-9 rounded-[11px] [&_svg]:size-[18px]",
  md: "size-11 rounded-[13px] [&_svg]:size-5",
  lg: "size-14 rounded-[15px] [&_svg]:size-6",
} as const;

const RING = {
  sm: "rounded-xl",
  md: "rounded-[14px]",
  lg: "rounded-2xl",
} as const;

/**
 * Aristache Obsidian Glass Icon Tile.
 *
 * Premium dark-glass surface, precision teal border,
 * subtle directional light and restrained hover glow.
 *
 * Uses the existing palette-aware CSS variables.
 */
export function IconTile({
  size = "md",
  className,
  children,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 p-px",

        // Precision gradient border
        "bg-[linear-gradient(145deg,rgb(var(--brand-mid-rgb)/0.48),rgb(var(--brand-deep-rgb)/0.13)_55%,rgb(var(--brand-mid-rgb)/0.22))]",

        // Restrained ambient shadow
        "shadow-[0_7px_18px_-13px_rgb(var(--brand-mid-rgb)/0.18)]",

        // Premium hover
        "transition-[box-shadow,transform] duration-300 ease-out",
        "group-hover:-translate-y-0.5",
        "group-hover:shadow-[0_9px_24px_-13px_rgb(var(--brand-mid-rgb)/0.32)]",

        "motion-reduce:transform-none motion-reduce:transition-none",

        RING[size],
        className,
      )}
    >
      <span
        className={cn(
          "relative isolate grid place-items-center overflow-hidden",

          // Dark glass with a subtle teal tint
          "bg-[linear-gradient(145deg,rgb(var(--brand-mid-rgb)/0.14),rgb(var(--brand-deep-rgb)/0.08)_50%,transparent),var(--chip-surface)]",

          // Existing theme-aware icon foreground
          "text-(--accent-on-chip)",

          // Consistent SVG rendering
          "[&_svg]:relative [&_svg]:z-10",
          "[&_svg]:transition-colors [&_svg]:duration-300",

          SIZES[size],
        )}
      >
        {/* Refined top-edge light reflection */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-px h-px bg-[linear-gradient(90deg,transparent,rgb(var(--brand-mid-rgb)/0.38),transparent)]"
        />

        {/* Very subtle internal illumination */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            "bg-[radial-gradient(circle_at_28%_12%,rgb(var(--brand-mid-rgb)/0.10),transparent_62%)]",
            "opacity-70 transition-opacity duration-300",
            "group-hover:opacity-100",
            "motion-reduce:transition-none",
          )}
        />

        {children}
      </span>
    </span>
  );
}

export const ICON_PROPS = {
  strokeWidth: 1.75,
  "aria-hidden": true,
} as const;
