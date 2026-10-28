"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BACKGROUND_VIDEO_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { useHeroPosterReady } from "@/hooks/useHeroPosterReady";

type Listener = (visible: boolean) => void;
const observers = new Map<
  string,
  { io: IntersectionObserver; listeners: Map<Element, Listener> }
>();

/** One shared IntersectionObserver per margin, so many backdrops cost one observer each. */
function observe(el: Element, rootMargin: string, listener: Listener) {
  // No IntersectionObserver (very old browsers): treat as visible, so the video still plays.
  if (typeof IntersectionObserver === "undefined") {
    listener(true);
    return () => {};
  }
  let entry = observers.get(rootMargin);
  if (!entry) {
    const listeners = new Map<Element, Listener>();
    const io = new IntersectionObserver(
      (records) =>
        records.forEach((r) =>
          listeners.get(r.target)?.(r.isIntersecting && r.intersectionRatio >= 0.01),
        ),
      { rootMargin, threshold: 0.01 },
    );
    entry = { io, listeners };
    observers.set(rootMargin, entry);
  }
  entry.listeners.set(el, listener);
  entry.io.observe(el);
  const { io, listeners } = entry;
  return () => {
    io.unobserve(el);
    listeners.delete(el);
  };
}

/** Attach the video source nearby; preload="none" defers data until playback. */
const LOAD_MARGIN = "200px 0px";
/** Only visible sections should decode and play video frames. */
const PLAY_MARGIN = "0px";
const POSTER_MARGIN = "600px 0px";

/**
 * Full-bleed section video. Desktop plays the loop only while the section is visible.
 * Mobile and reduced motion show the poster and never
 * mount a video. A missing file hides itself so the teal ground shows through.
 *
 * `screen` pins the loop to one viewport height at the top of the section.
 * `desktop-screen` applies that cap from lg upward, preserving mobile framing.
 * Stretching it over a tall section with object-cover zooms the frame.
 */
export function SectionBackdrop({
  video,
  poster,
  fetchPriority,
  deferUntilHeroLoaded = false,
  deferUntilNearViewport = false,
  responsivePoster,
  frame = "fill",
  scrim,
  focus = "center",
}: {
  video?: string;
  poster?: string;
  fetchPriority?: "high" | "low" | "auto";
  /** Keep this poster out of the initial HTML until the hero image loads or fails. */
  deferUntilHeroLoaded?: boolean;
  /** Opt in per section, so its image URLs stay absent until the backdrop is nearby. */
  deferUntilNearViewport?: boolean;
  responsivePoster?: {
    srcSet: string;
    aspectRatio: number;
    /** Limit available pixels on portrait phones, including high-density screens. */
    portrait?: { srcSet: string; maxWidth: number };
  };
  frame?: "fill" | "screen" | "desktop-screen";
  /** Overlay tint. Defaults stay with each frame. */
  scrim?: string;
  /**
   * Where object-cover keeps the subject. "left" holds a left-weighted 16:9
   * plate inside a portrait phone, then returns to center from the lg layout up.
   */
  focus?: "center" | "left";
}) {
  const reduce = useReducedMotion();
  const canPlayVideo = useMediaQuery(BACKGROUND_VIDEO_QUERY);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(Boolean(video));
  const [posterOk, setPosterOk] = useState(Boolean(poster));
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [posterNear, setPosterNear] = useState(false);
  const [posterWidth, setPosterWidth] = useState<number | null>(null);
  const posterReady = useHeroPosterReady(deferUntilHeroLoaded);
  const posterAspectRatio = responsivePoster?.aspectRatio;

  const showVideo = Boolean(video) && videoOk && !reduce && canPlayVideo;

  useEffect(() => {
    const root = rootRef.current;
    if (!deferUntilNearViewport || !root) return;
    return observe(root, POSTER_MARGIN, (nearby) => {
      if (nearby) setPosterNear(true);
    });
  }, [deferUntilNearViewport]);

  useEffect(() => {
    const root = rootRef.current;
    if (!posterAspectRatio || !root || (deferUntilNearViewport && !posterNear)) return;
    const landscape =
      focus === "left"
        ? window.matchMedia("(orientation: landscape) and (max-height: 500px)")
        : null;
    const update = (width: number, height: number) => {
      // object-cover can scale a wide image by height on a tall phone section.
      // Left-focused backdrops also have a 1.3x CSS scale on short landscape screens.
      const scale = landscape?.matches ? 1.3 : 1;
      setPosterWidth(Math.max(1, Math.ceil(Math.max(width, height * posterAspectRatio) * scale)));
    };
    const measure = () => {
      const { width, height } = root.getBoundingClientRect();
      update(width, height);
    };
    measure();
    landscape?.addEventListener("change", measure);
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
        landscape?.removeEventListener("change", measure);
      };
    }
    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      landscape?.removeEventListener("change", measure);
    };
  }, [posterAspectRatio, deferUntilNearViewport, posterNear, focus]);

  useEffect(() => {
    const root = rootRef.current;
    if (!showVideo || !root) return;
    const stopLoad = observe(root, LOAD_MARGIN, (visible) => {
      if (visible) setNear(true);
    });
    const stopPlay = observe(root, PLAY_MARGIN, setVisible);
    return () => {
      stopLoad();
      stopPlay();
    };
  }, [showVideo]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !showVideo || !near) return;
    if (visible) node.play().catch(() => {});
    else if (!node.paused) node.pause();
  }, [showVideo, near, visible]);

  const screen = frame === "screen";
  // A portrait phone crops a 16:9 plate on both sides. Left focus keeps a
  // subject that lives on the left of the frame on screen until the lg layout.
  // Phone landscape: the globe sits behind the headline. Scale up and slide the plate toward the
  // top-left so the globe clears the text column instead of sitting under it.
  const anchor =
    focus === "left"
      ? "object-[-100px_right] lg:object-center [@media(orientation:landscape)_and_(max-height:500px)]:origin-center [@media(orientation:landscape)_and_(max-height:500px)]:-translate-x-[14%] [@media(orientation:landscape)_and_(max-height:500px)]:-translate-y-[14%] [@media(orientation:landscape)_and_(max-height:500px)]:scale-[1.3]"
      : "object-center";
  const media = `absolute inset-0 h-full w-full object-cover ${anchor}`;
  const still = media;
  const scrimClass =
    scrim ??
    (screen
      ? "bg-background/95 absolute inset-0 md:bg-background/50 [@media(orientation:landscape)_and_(max-height:500px)]:bg-background/90"
      : "bg-background/70 absolute inset-0");

  // Decorative poster. A missing local file hides without an image optimizer error.
  // Stays on top of the video until it has a frame, so no blank or poster flash.
  const posterImage = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={poster}
      srcSet={responsivePoster?.srcSet}
      sizes={responsivePoster && posterWidth !== null ? `${posterWidth}px` : undefined}
      alt=""
      loading="lazy"
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setPosterOk(false)}
      className={showVideo && ready ? `${still} hidden` : still}
    />
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        ref={rootRef}
        className={
          screen
            ? "absolute top-0 left-0 h-screen max-h-full w-full overflow-hidden"
            : frame === "desktop-screen"
              ? "absolute inset-0 overflow-hidden lg:bottom-auto lg:h-svh lg:max-h-full"
              : "absolute inset-0"
        }
      >
        {showVideo && (
          <video
            ref={videoRef}
            className={media}
            muted
            loop
            playsInline
            preload="none"
            src={near ? video : undefined}
            onPlaying={() => setReady(true)}
            onError={() => setVideoOk(false)}
          />
        )}
        {poster &&
          posterOk &&
          posterReady &&
          (!deferUntilNearViewport || posterNear) &&
          (!responsivePoster || posterWidth !== null) &&
          (responsivePoster?.portrait ? (
            <picture>
              <source
                media="(max-width: 767px) and (orientation: portrait)"
                srcSet={responsivePoster.portrait.srcSet}
                sizes={`${Math.min(posterWidth ?? responsivePoster.portrait.maxWidth, responsivePoster.portrait.maxWidth)}px`}
              />
              {posterImage}
            </picture>
          ) : (
            posterImage
          ))}
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
    <div
      data-edge={edge}
      className={
        bottom
          ? "absolute inset-x-0 bottom-0 h-40 md:h-56"
          : "absolute inset-x-0 top-0 h-40 md:h-56"
      }
    >
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
            ? "absolute inset-0 bg-[linear-gradient(to_top,var(--bg)_0%,var(--bg)_4%,color-mix(in_srgb,var(--bg)_88%,transparent)_16%,color-mix(in_srgb,var(--bg)_68%,transparent)_30%,color-mix(in_srgb,var(--bg)_45%,transparent)_46%,color-mix(in_srgb,var(--bg)_24%,transparent)_62%,color-mix(in_srgb,var(--bg)_9%,transparent)_80%,transparent_100%)]"
            : "absolute inset-0 bg-[linear-gradient(to_bottom,var(--bg)_0%,var(--bg)_4%,color-mix(in_srgb,var(--bg)_88%,transparent)_16%,color-mix(in_srgb,var(--bg)_68%,transparent)_30%,color-mix(in_srgb,var(--bg)_45%,transparent)_46%,color-mix(in_srgb,var(--bg)_24%,transparent)_62%,color-mix(in_srgb,var(--bg)_9%,transparent)_80%,transparent_100%)]"
        }
      />
    </div>
  );
}
