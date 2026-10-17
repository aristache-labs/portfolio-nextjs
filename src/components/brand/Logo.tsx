import Image from "next/image";
import { cn } from "@/utils/cn";

const MARK = { src: "/brand/logo-no-text.svg", width: 1511, height: 1610 } as const;

/** Circular mark without the wordmark. The hero sets ARISTACHE in type beneath it. */
export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={MARK.src}
      alt=""
      width={MARK.width}
      height={MARK.height}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}

const MONOGRAM = { src: "/brand/logo-no-text.svg", width: 1511, height: 1610 } as const;

export function Logo({
  className,
  withWordmark = false,
  size = "size-12",
}: {
  className?: string;
  withWordmark?: boolean;
  /** Tailwind size utility for the mark. Defaults to the nav size. */
  size?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span role="img" aria-label="Aristache" className={cn("relative inline-flex", size)}>
        <Image
          src={MONOGRAM.src}
          alt=""
          width={MONOGRAM.width}
          height={MONOGRAM.height}
          priority
          unoptimized
          className={cn(size, "object-contain")}
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
