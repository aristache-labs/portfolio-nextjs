"use client";

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { m, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { HERO_VIDEO_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { SocialGlyph } from "./social-icons";
import { SectionEdge } from "./SectionBackdrop";
import { HERO_PIN_QUERY, HeroScrollMotion } from "./HeroScrollMotion";
import styles from "./hero-motion.module.css";
import { scrollToSection } from "@/lib/scroll-to-section";
import { IDENTITY } from "@/lib/identity";
export type HeroProfile = {
  name: string;
  roles: string[];
};

const HERO_COPY = IDENTITY.summary;
const PORTRAIT_POSTER = "/media/hero-portrait.webp";
const PORTRAIT_POSTER_QUERY =
  "(max-width: 767px) and (orientation: portrait) and (max-aspect-ratio: 3/4)";
const FULL_POSTER_SOURCES =
  "/media/hero-960.webp 960w, /media/hero-1280.webp 1280w, /media/hero.webp 1672w";
/** Cover-fit box for the 16:9 hero plate, centered in its size container. */
const PLATE =
  "absolute top-1/2 left-1/2 aspect-video w-[max(100cqw,calc(100cqh*16/9))] -translate-x-1/2 -translate-y-1/2";

// CSS owns copy entrances so mobile never waits for hydration to reveal its LCP text.
function entranceStyle(delay: number) {
  return { animationDelay: `${delay * 0.54}s` };
}

/** Mounted only for desktop motion, so touch devices never create pointer springs. */
function HeroSpotlight({ section }: { section: RefObject<HTMLElement | null> }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const spotX = useTransform(sx, [-0.5, 0.5], [30, 70]);
  const spotY = useTransform(sy, [-0.5, 0.5], [25, 65]);
  const background = useMotionTemplate`radial-gradient(520px circle at ${spotX}% ${spotY}%, rgb(var(--brand-mid-rgb) / 0.18), transparent 65%)`;

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = node.getBoundingClientRect();
      mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5);
      mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    };
    const reset = () => {
      mouseX.set(0);
      mouseY.set(0);
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
    };
  }, [mouseX, mouseY, section]);

  return <m.div className="absolute inset-0" style={{ background }} />;
}

/**
 * First screen: looping plate on the right, copy on the left, teal vignette.
 * Video and poster live in public/media. Accents stay on the Obsidian ramp.
 */
export function Hero({
  profile,
  heroTagline,
  resumeUrl,
  socials = [],
  transitionToAbout = false,
}: {
  profile: HeroProfile;
  heroTagline?: string | null;
  resumeUrl?: string | null;
  socials?: { platform: string; url: string }[];
  transitionToAbout?: boolean;
}) {
  const reduce = useReducedMotion();
  const { mode } = useAnimationPolicy();
  const expressive = mode === "expressive";
  const pinned = useMediaQuery(HERO_PIN_QUERY) && expressive && transitionToAbout;
  const stopAnchorScroll = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopAnchorScroll.current?.(), []);
  const navigateToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (!document.getElementById(id)) return;
    event.preventDefault();
    stopAnchorScroll.current?.();
    stopAnchorScroll.current = scrollToSection(id, reduce);
  };
  const canPlayVideo = useMediaQuery(HERO_VIDEO_QUERY);
  const portraitPoster = useMediaQuery(PORTRAIT_POSTER_QUERY);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // Some iPhone browsers paint below their reported large viewport. Reserve the
    // physical screen height in portrait, without resizing when toolbars move.
    const section = sectionRef.current;
    const phone = window.matchMedia(
      "(pointer: coarse) and (max-width: 767px) and (orientation: portrait)",
    );
    const sync = () => {
      if (phone.matches) {
        section?.style.setProperty("--portrait-screen-height", `${screen.height}px`);
      } else {
        section?.style.removeProperty("--portrait-screen-height");
      }
    };
    sync();
    phone.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      phone.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      section?.style.removeProperty("--portrait-screen-height");
    };
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reduce);
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  const [posterLoaded, setPosterLoaded] = useState<"portrait" | "full" | null>(null);
  const [videoOk, setVideoOk] = useState(true);
  const [posterOk, setPosterOk] = useState(true);

  const showVideo = videoOk && !reduce;
  // Wait for the selected poster before requesting video, including after rotation
  // changes the picture source from the portrait crop to the full frame.
  const mountVideo =
    showVideo &&
    canPlayVideo &&
    (posterLoaded === (portraitPoster ? "portrait" : "full") || !posterOk);

  const markPosterLoaded = (node: HTMLImageElement) => {
    setPosterLoaded(node.currentSrc.endsWith(PORTRAIT_POSTER) ? "portrait" : "full");
  };

  // The img may finish loading before hydration attaches onLoad.
  const posterRef = (node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) markPosterLoaded(node);
  };

  // Pause while scrolled away, resume only if the visitor has not paused it themselves.
  useEffect(() => {
    const section = sectionRef.current;
    if (!mountVideo || !section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const node = videoRef.current;
        if (!node) return;
        if (entry.isIntersecting) {
          if (playingRef.current) node.play().catch(() => {});
        } else node.pause();
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [mountVideo]);
  const iconSocials = ["github", "linkedin"].flatMap((id) => {
    const match = socials.find((s) => s.platform.toLowerCase() === id && s.url);
    return match ? [match] : [];
  });

  const [firstName, ...remainingName] = profile.name.trim().split(/\s+/);

  const toggleVideo = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      node.play().catch(() => {});
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-cinematic={transitionToAbout || undefined}
      className={`${styles.hero} relative scroll-mt-24`}
    >
      {mode !== "static" && (
        <HeroScrollMotion section={sectionRef} expressive={expressive} pinned={pinned} />
      )}
      <div
        className={`${styles.scene} relative flex flex-col overflow-clip md:min-h-[min(100svh,56rem)] md:justify-center max-md:portrait:min-h-[max(100lvh,var(--portrait-screen-height,0px))]`}
      >
        <div
          className="[container-type:size] pointer-events-none absolute inset-0 z-0 overflow-clip"
          aria-hidden
        >
          <div className={`${styles.scrollMedia} absolute inset-0`}>
            {posterOk && (
              <picture className={`${styles.poster} absolute inset-0`}>
                <source media={PORTRAIT_POSTER_QUERY} srcSet={PORTRAIT_POSTER} type="image/webp" />
                {/* Cover-fit depends on height as well as width. Keep enough pixels for tall
                viewports; the portrait source preserves the original full-height detail. */}
                <img
                  ref={posterRef}
                  src="/media/hero.webp"
                  srcSet={FULL_POSTER_SOURCES}
                  sizes="max(100vw, 178lvh)"
                  alt=""
                  fetchPriority="high"
                  onLoad={(event) => markPosterLoaded(event.currentTarget)}
                  onError={() => setPosterOk(false)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </picture>
            )}
            <div className="bg-background/70 absolute inset-0 md:hidden" />
            {/* Desktop plate: sized exactly like object-cover on a 16:9 picture, so anything placed
            inside it by percentage stays on the same spot of the picture at any screen size. */}
            <div className={`${PLATE} hidden md:block landscape:block`}>
              {/* The poster stays put beneath the video, preserving its framing during playback. */}
              {mountVideo && (
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onError={() => setVideoOk(false)}
                >
                  <source src="/media/hero-v2.mp4" type="video/mp4" />
                </video>
              )}
            </div>
          </div>
          <div className={`${styles.scrim} hero-vignette absolute inset-0`} />
          {expressive && <HeroSpotlight section={sectionRef} />}
          <div className="hero-noise absolute inset-0" />
          <SectionEdge edge="bottom" />
        </div>

        {mountVideo && (
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={playing ? "Pause background video" : "Play background video"}
            className="border-border bg-background/40 text-foreground/70 hover:text-foreground absolute right-6 bottom-24 z-20 hidden size-10 items-center justify-center rounded-full border backdrop-blur-md md:flex landscape:flex"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        )}

        <div
          className={`${styles.content} ${styles.scrollCopy} site-container relative z-10 grid items-center gap-10 pt-28 pb-8 md:pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] [@media(max-height:500px)]:gap-0 [@media(max-height:500px)]:pt-[92px] [@media(max-height:500px)]:pb-10 [@media(max-height:500px)]:md:pb-10`}
        >
          <div className={`${styles.intro} min-w-0 lg:pl-8`}>
            <p className={styles.specialization}>{profile.roles.join(" · ")}</p>

            <h1 className="max-w-3xl">
              <span className={`${styles.name} font-display block`}>
                {firstName}
                {remainingName.length > 0 && (
                  <>
                    {" "}
                    <span className={styles.surname}>{remainingName.join(" ")}</span>
                  </>
                )}
              </span>{" "}
              <span
                style={entranceStyle(0.45)}
                className={`${styles.enter} ${styles.headline} font-display mt-3 block text-[clamp(1.15rem,2.2vw,1.75rem)] leading-[1.2] font-bold tracking-tight [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-[0.9rem]`}
              >
                Infrastructure meets <span className="text-(--brand-mid)">innovation.</span>
              </span>
            </h1>

            <p
              style={entranceStyle(0.6)}
              className={`${styles.enter} ${styles.copy} text-foreground/95 mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-[12px] [@media(max-height:500px)]:leading-snug`}
            >
              {HERO_COPY}
            </p>

            {heroTagline && (
              <p
                style={entranceStyle(0.7)}
                className={`${styles.enter} mt-4 [@media(max-height:500px)]:mt-2`}
              >
                <span className={styles.tagline}>{heroTagline}</span>
              </p>
            )}

            <div
              className={`${styles.actions} mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:gap-2`}
            >
              <Magnetic className={`${styles.actionEntrance} ${styles.actionFirst} max-sm:w-full`}>
                <Button
                  variant="primary"
                  size="lg"
                  href="#projects"
                  onClick={(event) => navigateToSection(event, "projects")}
                  className={`${styles.primaryAction} rounded-xl px-7 py-3.5 max-sm:w-full [@media(max-height:500px)]:py-2`}
                >
                  Explore Projects
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Magnetic>
              <div className="flex gap-3 sm:contents">
                <Magnetic
                  className={`${styles.actionEntrance} ${styles.actionSecond} max-sm:min-w-0 max-sm:flex-1`}
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    href="#contact"
                    onClick={(event) => navigateToSection(event, "contact")}
                    className={`${styles.contactAction} rounded-xl px-6 py-3.5 max-sm:w-full`}
                  >
                    Get in Touch
                  </Button>
                </Magnetic>
              </div>
            </div>

            <div className={styles.secondaryLinks}>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.textLink}
                >
                  Resume <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
              {iconSocials.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  aria-label={social.platform}
                  {...(social.url.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={styles.textLink}
                >
                  <SocialGlyph platform={social.platform} className="size-4 object-contain" />
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
        </div>

        <a
          href="#projects"
          onClick={(event) => navigateToSection(event, "projects")}
          className="text-foreground/50 hover:text-foreground relative z-10 mb-10 flex flex-col items-center gap-2 self-center md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:-translate-x-1/2 [@media(max-height:500px)]:flex-row [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:translate-y-3"
          aria-label="Scroll to explore, jump to projects"
        >
          <span className="border-foreground/25 flex h-10 w-6 items-start justify-center rounded-full border p-1.5 [@media(max-height:500px)]:h-6 [@media(max-height:500px)]:w-4 [@media(max-height:500px)]:p-1">
            <span className="animate-scroll-dot h-2 w-1 rounded-full bg-(--brand-bright)" />
          </span>
          <span className="text-xs tracking-wide">Scroll to explore</span>
        </a>
      </div>
    </section>
  );
}

export default Hero;
