"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Full-bleed section video. Desktop plays the loop. Mobile and reduced motion
 * show the poster. A missing file hides itself so the teal ground shows through.
 */
export function SectionBackdrop({ video, poster }: { video?: string; poster?: string }) {
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

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {showVideo && (
        <video
          ref={videoRef}
          className="hidden h-full w-full object-cover md:block"
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
          className={
            showVideo ? "h-full w-full object-cover md:hidden" : "h-full w-full object-cover"
          }
        />
      )}
      <div className="bg-background/60 absolute inset-0" />
      <SectionEdge edge="top" />
      <SectionEdge edge="bottom" />
    </div>
  );
}
/** Soft join between stacked videos: blur the plate, then dissolve into the page ground. */
export function SectionEdge({ edge }: { edge: "top" | "bottom" }) {
  const bottom = edge === "bottom";
  return (
    <div
      className={
        bottom
          ? "absolute inset-x-0 bottom-0 h-18"
          : "absolute inset-x-0 top-0 h-18"
      }
    >
      <div
        className={
          bottom
            ? "absolute inset-0 backdrop-blur-xl [mask-image:linear-gradient(to_top,black,transparent)]"
            : "absolute inset-0 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black,transparent)]"
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