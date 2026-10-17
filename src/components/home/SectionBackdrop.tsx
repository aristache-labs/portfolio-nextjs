"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Full-bleed section video. Desktop plays the loop. Mobile and reduced motion
 * show the poster. A missing file hides itself so the teal ground shows through.
 *
 * `screen` pins the loop to one viewport height at the top of the section.
 * Stretching it over a tall section with object-cover zooms the frame.
 */
export function SectionBackdrop({
  video,
  poster,
  frame = "fill",
  scrim,
}: {
  video?: string;
  poster?: string;
  frame?: "fill" | "screen";
  /** Overlay tint. Defaults stay with each frame. */
  scrim?: string;
}) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(Boolean(video));
  const [posterOk, setPosterOk] = useState(Boolean(poster));

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (reduce) node.pause();
  }, [reduce]);

  const showVideo = Boolean(video) && videoOk && !reduce;

  const screen = frame === "screen";
  // Skills pins the loop to one viewport and scales it down from the left
  // so the planet stays small and clear of the cards. object-cover on the
  // full section height is what zooms it.
  const media = "absolute inset-0 hidden h-full w-full object-cover object-center md:block";
  const still = screen
    ? "absolute inset-20 h-full w-full object-cover object-center md:origin-[22%_46%] md:scale-[0.58]"
    : "absolute inset-0 h-full w-full object-cover object-center";
  const scrimClass =
    scrim ??
    (screen
      ? "bg-background/80 absolute inset-0 md:bg-background/70"
      : "bg-background/60 absolute inset-0");

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className={
          screen ? "absolute top-0 left-0 h-screen w-full overflow-hidden" : "absolute inset-0"
        }
      >
        {showVideo && (
          <video
            ref={videoRef}
            className={media}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            onError={() => setVideoOk(false)}
          >
            <source src={video} type="video/mp4" />
          </video>
        )}
        {poster && posterOk && (
          // Decorative poster. next/image 400s a missing local file; a plain img just hides.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            onError={() => setPosterOk(false)}
            className={showVideo ? `${still} md:hidden` : still}
          />
        )}
        <div className={scrimClass} />
        {screen && (
          <div className="to-background/40 absolute inset-0 bg-gradient-to-r from-transparent via-transparent" />
        )}
        <SectionEdge edge="top" />
        <SectionEdge edge="bottom" />
      </div>
    </div>
  );
}
/** Soft join between stacked videos: blur the plate, then dissolve into the page ground. */
export function SectionEdge({ edge }: { edge: "top" | "bottom" }) {
  const bottom = edge === "bottom";
  return (
    <div className={bottom ? "absolute inset-x-0 bottom-0 h-18" : "absolute inset-x-0 top-0 h-18"}>
      <div
        className={
          bottom
            ? "absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)] backdrop-blur-xl"
            : "absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] backdrop-blur-xl"
        }
      />
      <div
        className={
          bottom
            ? "absolute inset-0 bg-[linear-gradient(to_top,var(--bg)_0%,var(--bg)_2%,transparent_100%)]"
            : "absolute inset-0 bg-[linear-gradient(to_bottom,var(--bg)_0%,var(--bg)_2%,transparent_100%)]"
        }
      />
    </div>
  );
}
