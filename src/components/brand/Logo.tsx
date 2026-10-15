import Image from "next/image";
import { cn } from "@/utils/cn";

const MARK = {
  light: { src: "/brand/aristache-monogram-light.png", width: 872, height: 872 },
  dark: { src: "/brand/aristache-monogram-dark.png", width: 925, height: 789 },
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
        className={cn("dark:hidden", className)}
      />
      <Image
        src={MARK.dark.src}
        alt=""
        width={MARK.dark.width}
        height={MARK.dark.height}
        priority={priority}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}

export function Logo({
  className,
  withWordmark = false,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        role="img"
        aria-label="Aristache"
        className="inline-flex size-10 shrink-0 items-center justify-center"
      >
        <BrandMark priority className="h-8 w-auto" />
      </span>
      {withWordmark ? (
        <span className="text-foreground font-sans text-lg leading-none font-semibold tracking-tight">
          Aristache
        </span>
      ) : null}
    </span>
  );
}
