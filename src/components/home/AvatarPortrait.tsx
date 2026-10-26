"use client";

import Image from "next/image";
import { useHeroPosterReady } from "@/hooks/useHeroPosterReady";
import { ShineBorder } from "@/components/ui/shine-border";

// Match the outer CSS widths; the browser applies pixel density itself.
const PORTRAIT_SIZES = [
  "(orientation: portrait) and (max-width: 767px) 192px",
  "(orientation: landscape) and (max-height: 500px) and (pointer: coarse) 176px",
  "(orientation: landscape) and (max-height: 500px) 256px",
  "(min-width: 1024px) 384px",
  "(min-width: 640px) 320px",
  "288px",
].join(", ");

// Leaf silhouette: two large corners opposite two small ones. Scaled-down twins
// of these radii live in admin/AvatarField, whose preview is a third of this width.
const SHAPE = "rounded-[6rem_1.75rem_6rem_1.75rem]";

/**
 * Square, so the frame's height falls out of its width and both columns start at the same y.
 * Carries no Parallax for that reason - its scroll transform is exactly what pulled the frame out
 * of alignment with the text beside it. About owns its entrance; the photo has no fade or zoom.
 */
export function AvatarPortrait({ src, name }: { src: string; name: string }) {
  const heroReady = useHeroPosterReady();

  return (
    <div className="relative flex w-72 max-w-full sm:w-80 lg:w-96 [@media(orientation:landscape)_and_(max-height:500px)]:w-64">
      {/* p-0.5 over the gradient paints a 2px ring no border-color token can produce. */}
      <div
        className={`relative flex aspect-square flex-1 bg-(image:--gradient-brand) p-0.5 shadow-xl ${SHAPE}`}
      >
        <div className={`relative flex-1 overflow-hidden ${SHAPE}`}>
          {heroReady && (
            <Image
              src={src}
              alt={`Portrait of ${name}`}
              fill
              quality={90}
              loading="eager"
              sizes={PORTRAIT_SIZES}
              className="object-cover"
            />
          )}
          <span
            aria-hidden
            className={`absolute inset-0 ring-1 ring-white/20 ring-inset ${SHAPE}`}
          />
        </div>
        <ShineBorder />
      </div>
    </div>
  );
}
