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
      <span className="inline-flex rounded-lg bg-[#080c0d] p-0.5 dark:bg-transparent">
        <Image
          src="/brand/aristache-monogram.png"
          alt="Aristache"
          width={1359}
          height={1157}
          className="h-8 w-auto"
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
