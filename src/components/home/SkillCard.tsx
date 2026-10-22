"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { useReducedMotionProps } from "@/hooks/useReducedMotion";
import { cn } from "@/utils/cn";

const INVERT_IN_LIGHT = /nextjs|next-js|next\.|vercel|express|flask|github|apple/i;

const LEVEL_PERCENT: Record<string, number> = {
  Expert: 90,
  Intermediate: 75,
  Beginner: 55,
};

/** Old rows stored /skills/brand/*.svg. Files now live in /skills/. */
export function skillIconSrc(iconPath: string) {
  return iconPath.replace("/skills/brand/", "/skills/");
}

export function skillPercent(level?: string | null): number | null {
  if (!level) return null;
  if (level in LEVEL_PERCENT) return LEVEL_PERCENT[level];
  const numeric = Number(level);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 100) return numeric;
  return null;
}

export function SkillCard({
  name,
  iconPath,
  category,
  level,
  index,
}: {
  name: string;
  iconPath: string;
  category: string;
  level?: string | null;
  index: number;
}) {
  const reducedMotionProps = useReducedMotionProps();
  const src = skillIconSrc(iconPath);
  const percent = skillPercent(level);
  const invertLight =
    !src.includes("/skills/") && (INVERT_IN_LIGHT.test(src) || INVERT_IN_LIGHT.test(name));

  return (
    <m.div
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4 }}
      {...reducedMotionProps}
      className="group hover:border-brand-mid/40 relative flex h-full min-w-0 flex-col rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] px-3 py-3 backdrop-blur-[18px] transition-colors duration-300 hover:shadow-[0_16px_50px_rgb(var(--brand-mid-rgb)/0.22)] sm:px-4 sm:py-3.5"
    >
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-white/4 transition-colors duration-300 group-hover:bg-white/7">
        <Image
          src={src}
          alt=""
          fill
          sizes="36px"
          unoptimized
          className={cn("object-contain", invertLight && "invert dark:invert-0")}
        />
      </span>

      <span className="mt-3 flex items-start justify-between gap-2">
        <span
          title={name}
          className="text-foreground min-w-0 flex-1 text-[13px] leading-snug font-semibold [overflow-wrap:anywhere]"
        >
          {name}
        </span>
        {percent != null && (
          <span className="text-foreground/60 shrink-0 font-mono text-[11px] sm:text-xs">
            {percent}%
          </span>
        )}
      </span>

      {percent != null && (
        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-white/10">
          <m.span
            initial={{ width: 0 }}
            whileInView={{ width: `${percent}%` }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 1, delay: 0.2 + (index % 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            {...reducedMotionProps}
            className="block h-full rounded-full bg-(image:--gradient-brand) shadow-[0_0_12px_rgb(var(--brand-mid-rgb)/0.6)]"
          />
        </span>
      )}

      <span className="text-foreground/60 mt-2 block text-[11px]">{category}</span>
    </m.div>
  );
}
