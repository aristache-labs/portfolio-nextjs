"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from "react";
import { m, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { HERO_VIDEO_QUERY, PORTRAIT_PHONE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { SocialGlyph } from "./social-icons";
import { SectionEdge } from "./SectionBackdrop";
import { HERO_LANDSCAPE_PIN_QUERY, HERO_PIN_QUERY, HeroScrollMotion } from "./HeroScrollMotion";
import { HeroDepth } from "./HeroDepth";
import styles from "./hero-motion.module.css";
import { scrollToSection } from "@/lib/scroll-to-section";
import { IDENTITY } from "@/lib/identity";
import { useConsentInset } from "@/lib/consent-inset";
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
/** Quiet scroll time before a paused hero video may play again. */
const VIDEO_RESUME_DELAY = 400;
/** Cover-fit box for the 16:9 hero plate, centered in its size container. */
const PLATE =
  "absolute top-1/2 left-1/2 aspect-video w-[max(100cqw,calc(100cqh*16/9))] -translate-x-1/2 -translate-y-1/2";

// CSS owns copy entrances so mobile never waits for hydration to reveal its LCP text.
function entranceStyle(delay: number) {
  return { "--hero-enter-delay": `${delay * 0.54}s` } as CSSProperties;
}

function staggerStyle(index: number) {
  return { "--i": index } as CSSProperties;
}

/** The mask stays aligned with the text; only the reflected light moves. */
function HeroNameText({ text, surname = false }: { text: string; surname?: boolean }) {
  const line = useRef<HTMLSpanElement>(null);
  const baseline = useRef<HTMLSpanElement>(null);
  const maskText = useRef<SVGTextElement>(null);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const node = line.current;
    const marker = baseline.current;
    if (!node || !marker) return;
    let active = true;
    const measure = () => {
      if (active) maskText.current?.setAttribute("y", String(marker.offsetTop));
    };
    measure();
    void document.fonts?.ready.then(measure);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [text]);

  return (
    <span ref={line} className={`${styles.nameLine}${surname ? ` ${styles.surname}` : ""}`}>
      <span className={styles.nameInk}>
        {text}
        <span ref={baseline} aria-hidden className={styles.nameBaseline} />
      </span>
      <svg aria-hidden focusable="false" className={styles.nameSheen}>
        <defs>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <text ref={maskText} x="0" className={styles.nameMask}>
              {text}
            </text>
          </mask>
          <linearGradient id={`${id}-light`}>
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.4" stopColor="white" stopOpacity="0.12" />
            <stop offset="0.5" stopColor="white" />
            <stop offset="0.6" stopColor="white" stopOpacity="0.12" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g mask={`url(#${id}-mask)`}>
          <rect
            className={styles.nameReflection}
            width="35%"
            height="100%"
            fill={`url(#${id}-light)`}
          />
        </g>
      </svg>
    </span>
  );
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
  const consentInset = useConsentInset();
  const { mode } = useAnimationPolicy();
  const expressive = mode === "expressive";
  const desktopPinned = useMediaQuery(HERO_PIN_QUERY) && expressive && transitionToAbout;
  const touchScene =
    useMediaQuery(HERO_LANDSCAPE_PIN_QUERY) && mode !== "static" && transitionToAbout;
  // Portrait phones use CSS-only scroll motion, so no per-frame script is mounted for them.
  const portraitPhone = useMediaQuery(PORTRAIT_PHONE_QUERY);
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
  // Resuming waits for scrolling to settle: phones rebuild the video decoder on every
  // play(), and repeated jumps to Contact and back made landscape phones freeze, then crash.
  useEffect(() => {
    const section = sectionRef.current;
    if (!mountVideo || !section) return;
    let visible = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleResume = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        const node = videoRef.current;
        if (visible && playingRef.current && node?.paused) node.play().catch(() => {});
      }, VIDEO_RESUME_DELAY);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        const node = videoRef.current;
        if (!node) return;
        if (visible) scheduleResume();
        else {
          clearTimeout(resumeTimer);
          if (!node.paused) node.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    const onScroll = () => {
      if (visible && videoRef.current?.paused) scheduleResume();
    };
    io.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(resumeTimer);
    };
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
      data-touch-scene={touchScene || undefined}
      className={`${styles.hero} relative scroll-mt-24`}
      style={{ "--hero-consent-inset": `${consentInset}px` } as CSSProperties}
    >
      {mode !== "static" && !portraitPhone && (
        <HeroScrollMotion
          section={sectionRef}
          expressive={expressive}
          variant={desktopPinned ? "desktop" : touchScene ? "touch" : undefined}
        />
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
          {expressive && <HeroDepth section={sectionRef} />}
          <div aria-hidden className={styles.halo} />
          <div className="hero-noise absolute inset-0" />
          <div className={styles.handoff} />
          <SectionEdge edge="bottom" />
        </div>

        {mountVideo && (
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={playing ? "Pause background video" : "Play background video"}
            className={`${styles.sceneControl} border-border bg-background/40 text-foreground/70 hover:text-foreground absolute right-6 bottom-24 z-20 hidden size-10 items-center justify-center rounded-full border backdrop-blur-md md:flex landscape:flex`}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        )}

        <div
          className={`${styles.content} ${styles.scrollCopy} site-container relative z-10 grid items-center gap-10 pt-28 pb-8 md:pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] [@media(max-height:500px)]:gap-0 [@media(max-height:500px)]:pt-[92px] [@media(max-height:500px)]:pb-10 [@media(max-height:500px)]:md:pb-10`}
        >
          <div className={`${styles.intro} min-w-0 lg:pl-8`}>
            <p className={styles.specialization}>
              <span className={styles.specializationEntrance}>
                {profile.roles.map((role, i) => (
                  <Fragment key={role}>
                    {i > 0 && (
                      <span className={styles.roleDot} style={staggerStyle(i)}>
                        {" · "}
                      </span>
                    )}
                    <span className={styles.role} style={staggerStyle(i)}>
                      {role}
                    </span>
                  </Fragment>
                ))}
                <span aria-hidden className={styles.caret} />
              </span>
            </p>

            <h1 className={`${styles.exitTitle} max-w-3xl`}>
              <span className={`${styles.name} font-display block`}>
                <HeroNameText text={firstName} />
                {remainingName.length > 0 && (
                  <>
                    {" "}
                    <HeroNameText text={remainingName.join(" ")} surname />
                  </>
                )}
              </span>{" "}
              <span
                className={`${styles.headline} font-display mt-3 block text-[clamp(1.15rem,2.2vw,1.75rem)] leading-[1.2] font-bold tracking-tight [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-[0.9rem]`}
              >
                <span className={styles.word} style={staggerStyle(0)}>
                  Infrastructure
                </span>{" "}
                <span className={styles.word} style={staggerStyle(1)}>
                  meets
                </span>{" "}
                <span
                  className={`${styles.word} ${styles.accentWord} text-(--brand-mid)`}
                  style={staggerStyle(2)}
                >
                  innovation.
                </span>
              </span>
            </h1>

            <div className={styles.exitDetails}>
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
            </div>

            <div
              className={`${styles.actions} ${styles.exitActions} mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:gap-2`}
            >
              <Magnetic className={`${styles.actionEntrance} ${styles.actionFirst} max-sm:w-full`}>
                <Button
                  variant="primary"
                  size="lg"
                  href="#projects"
                  onClick={(event) => navigateToSection(event, "projects")}
                  className={`${styles.primaryAction} rounded-xl px-8 py-4 text-base max-sm:w-full [@media(max-height:500px)]:py-2.5`}
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
                    className={`${styles.contactAction} rounded-xl px-7 py-4 text-base max-sm:w-full`}
                  >
                    Get in Touch
                  </Button>
                </Magnetic>
              </div>
            </div>

            <div className={`${styles.secondaryLinks} ${styles.exitActions}`}>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.textLink}
                >
                  Resume <ArrowUpRight className="size-6" aria-hidden />
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
                  <SocialGlyph platform={social.platform} className="size-8 object-contain" />
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
        </div>

        <a
          href="#projects"
          onClick={(event) => navigateToSection(event, "projects")}
          className={`${styles.sceneControl} ${styles.scrollCue} text-foreground/50 hover:text-foreground relative z-10 mb-16 flex flex-col items-center gap-2 self-center md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:-translate-x-1/2 [@media(max-height:500px)]:flex-row [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:-translate-y-10`}
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
