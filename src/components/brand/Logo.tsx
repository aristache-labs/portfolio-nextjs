import Image from "next/image";
import { cn } from "@/utils/cn";

export function Logo({
  className,
  withWordmark = false,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#080c0d] dark:size-auto dark:bg-transparent">
        <Image
          src="/brand/aristache-monogram.png"
          alt="Aristache"
          width={1359}
          height={1157}
          className="h-7 w-auto dark:h-8"
          priority
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
