import Image from "next/image";
import { cn } from "@/utils/cn";

const MONOGRAM = { src: "/brand/logo-no-text.webp", width: 128, height: 128 } as const;

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
