import Image from "next/image";
import { cn } from "@/utils/cn";

const MARK = {
  light: { src: "/brand/aristache-monogram-light.svg", width: 1388, height: 1182 },
  dark: { src: "/brand/aristache-monogram-dark.svg", width: 1388, height: 1182 },
} as const;

/** Light-theme mark, plus the dark-theme mark. The dark one is hidden until `.dark`. */
export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={MARK.light.src}
        alt=""
        width={MARK.light.width}
        height={MARK.light.height}
        priority={priority}
        unoptimized
        className={cn("dark:hidden", className)}
      />
      {/* The dark file has less empty padding, so the same box paints a
          larger glyph. 0.8 lines the visible mark up with the light file. */}
      <Image
        src={MARK.dark.src}
        alt=""
        width={MARK.dark.width}
        height={MARK.dark.height}
        priority={priority}
        unoptimized
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}

const MONOGRAM = { src: "/brand/aristache-monogram.svg", width: 1306, height: 1306 } as const;

export function Logo({
  className,
  withWordmark = false,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span role="img" aria-label="Aristache" className="relative inline-flex size-23">
        <svg aria-hidden className="absolute size-0" focusable="false">
          <filter
            id="aristache-logo-edge"
            x="-6%"
            y="-6%"
            width="112%"
            height="112%"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown" />
            <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
            <feFlood floodColor="#76f5e1" floodOpacity="0.85" result="cyan" />
            <feComposite in="cyan" in2="ring" operator="in" result="stroke" />
            <feComposite in="SourceGraphic" in2="stroke" operator="over" />
          </filter>
        </svg>
        <Image
          src={MONOGRAM.src}
          alt=""
          width={MONOGRAM.width}
          height={MONOGRAM.height}
          priority
          unoptimized
          className="size-23 object-contain dark:[filter:url(#aristache-logo-edge)]"
        />
      </span>
      {withWordmark ? (
        <span className="text-foreground font-sans text-lg leading-none font-semibold tracking-tight">
          Aristache
        </span>
      ) : null}
    </span>
  );
}
