"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { m, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HERO_VIDEO_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { SocialGlyph } from "./social-icons";
import { IconTile } from "@/components/ui/IconTile";
import { SectionEdge } from "./SectionBackdrop";
import styles from "./hero-motion.module.css";
import subtitleCss from "./section-subtitle.module.css";
import { scrollToSection } from "@/lib/scroll-to-section";
import { IDENTITY } from "@/lib/identity";
export type HeroProfile = {
  name: string;
  roles: string[];
};

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_COPY = IDENTITY.summary;
const FOCUS = ["Systems", "Apps", "Automation", "Delivery"] as const;
const GREETING = "// HELLO, I'M";
/** Cover-fit box for the 16:9 hero plate, centered in its size container. */
const PLATE =
  "absolute top-1/2 left-1/2 aspect-video w-[max(100cqw,calc(100cqh*16/9))] -translate-x-1/2 -translate-y-1/2";

function fadeUp(reduce: boolean, delay: number) {
  return {
    initial: reduce ? false : ({ opacity: 0, y: 12 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.45, ease: EASE, delay: reduce ? 0 : delay * 0.14 },
  };
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
}: {
  profile: HeroProfile;
  heroTagline?: string | null;
  resumeUrl?: string | null;
  socials?: { platform: string; url: string }[];
}) {
  const reduce = useReducedMotion();
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
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const [posterOk, setPosterOk] = useState(true);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const spotX = useTransform(sx, [-0.5, 0.5], [30, 70]);
  const spotY = useTransform(sy, [-0.5, 0.5], [25, 65]);
  const spotBg = useMotionTemplate`radial-gradient(520px circle at ${spotX}% ${spotY}%, rgb(var(--brand-mid-rgb) / 0.18), transparent 65%)`;

  const showVideo = videoOk && !reduce;
  // The poster is the LCP image: hold the video request until it has arrived (or failed), so
  // hero.mp4 never competes with hero.webp, including on landscape phones.
  const mountVideo = showVideo && canPlayVideo && (posterLoaded || !posterOk);

  // The img may finish loading before hydration attaches onLoad.
  const posterRef = (node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setPosterLoaded(true);
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

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  };

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
      onMouseMove={onMouseMove}
      className={`${styles.hero} relative flex scroll-mt-24 flex-col overflow-clip md:min-h-[min(100svh,56rem)] md:justify-center max-md:portrait:min-h-[max(100lvh,var(--portrait-screen-height,0px))]`}
    >
      <div
        className="[container-type:size] pointer-events-none absolute inset-0 z-0 overflow-clip"
        aria-hidden
      >
        {posterOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={posterRef}
            src="/media/hero.webp"
            alt=""
            fetchPriority="high"
            onLoad={() => setPosterLoaded(true)}
            onError={() => setPosterOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="bg-background/70 absolute inset-0 md:hidden" />
        {/* Desktop plate: sized exactly like object-cover on a 16:9 picture, so anything placed
            inside it by percentage stays on the same spot of the picture at any screen size. */}
        <div className={`${PLATE} hidden md:block landscape:block`}>
          {/* The poster img is the LCP candidate and stays put: the video mounts above it, so the
              swap never creates a later, same-size LCP element. */}
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
              <source src="/media/hero.mp4" type="video/mp4" />
            </video>
          )}
        </div>
        <div className="hero-vignette absolute inset-0" />
        {!reduce && (
          <m.div className="absolute inset-0 hidden md:block" style={{ background: spotBg }} />
        )}
        <div className="hero-noise absolute inset-0" />
        <SectionEdge edge="bottom" />
        <div
          className={`${PLATE} hidden lg:block [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:block`}
        >
          <m.div
            {...fadeUp(reduce, 0.85)}
            className={`${styles.focus} glass bg-background/70 absolute top-[45%] left-[73%] max-w-[300px] rounded-2xl border border-(--brand-mid)/25 px-5 py-6 shadow-[0_0_40px_rgb(var(--brand-mid-rgb)/0.25)] backdrop-blur-md [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:top-[37%] [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:left-[71.5%]`}
          >
            <p className="font-mono text-[11px] tracking-[0.25em] text-(--brand-bright)/70 uppercase">
              {"// scope"}
            </p>
            <p className="text-foreground/80 mt-2 text-sm leading-relaxed">
              {FOCUS.map((word, i) => (
                <span key={word}>
                  {i > 0 && <span className="text-(--brand-mid)"> · </span>}
                  {word}
                </span>
              ))}
            </p>
          </m.div>
        </div>
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
        className={`${styles.content} site-container relative z-10 grid items-center gap-10 pt-28 pb-8 md:pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] [@media(max-height:500px)]:gap-0 [@media(max-height:500px)]:pt-[92px] [@media(max-height:500px)]:pb-10 [@media(max-height:500px)]:md:pb-10`}
      >
        <div className="max-w-2xl min-w-0 lg:pl-8">
          <m.p
            {...fadeUp(reduce, 0.15)}
            className="mb-3 font-mono text-[13px] tracking-[0.35em] text-(--brand-bright)/90 [@media(max-height:500px)]:mb-1 [@media(max-height:500px)]:text-[11px]"
          >
            <span className={styles.greeting}>{GREETING}</span>
          </m.p>

          <h1 className="max-w-3xl">
            <span className="font-display block cursor-default bg-[linear-gradient(92deg,#f7fffd_6%,#76f5e1_46%,#58e5d0_82%)] bg-clip-text text-[clamp(2.5rem,4.8vw,4.5rem)] leading-[1] font-extrabold tracking-tight text-transparent [@media(max-height:500px)]:text-[clamp(1.8rem,3.6vw,2.75rem)]">
              {profile.name.trim().split(/\s+/)[0]}
            </span>{" "}
            <m.span
              {...fadeUp(reduce, 0.45)}
              className="font-display mt-3 block text-[clamp(1.15rem,2.2vw,1.75rem)] leading-[1.2] font-bold tracking-tight [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-[0.9rem]"
            >
              IT expertise. <span className="text-(--brand-mid)">Web & mobile development.</span>
            </m.span>
          </h1>

          <m.p
            {...fadeUp(reduce, 0.6)}
            className={`${styles.copy} text-foreground/95 mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-[12px] [@media(max-height:500px)]:leading-snug`}
          >
            {HERO_COPY}
          </m.p>

          {heroTagline && (
            <m.p {...fadeUp(reduce, 0.7)} className="mt-4 [@media(max-height:500px)]:mt-2">
              <span className="border-border bg-background/40 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase backdrop-blur-sm">
                <span
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-(image:--gradient-brand) shadow-[0_0_8px_2px_rgb(var(--brand-mid-rgb)/0.6)] motion-reduce:animate-none"
                />
                {heroTagline}
              </span>
            </m.p>
          )}

          <m.div
            {...fadeUp(reduce, 0.8)}
            className={`${styles.actions} mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:gap-2`}
          >
            <Magnetic className="max-sm:w-full">
              <Button
                variant="primary"
                size="lg"
                href="#projects"
                onClick={(event) => navigateToSection(event, "projects")}
                className="rounded-2xl px-7 py-3.5 shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.55)] max-sm:w-full [@media(max-height:500px)]:py-2"
              >
                Explore Projects
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Magnetic>
            <div className="flex gap-3 sm:contents">
              <Magnetic className="max-sm:min-w-0 max-sm:flex-1">
                <Button
                  variant="secondary"
                  size="lg"
                  href="#contact"
                  onClick={(event) => navigateToSection(event, "contact")}
                  className="border-foreground/20 bg-foreground/3 rounded-2xl px-4 py-3.5 backdrop-blur-md hover:border-(--brand-mid)/60 hover:bg-(--brand-mid)/10 max-sm:w-full sm:px-7 [@media(max-height:500px)]:py-2"
                >
                  Get in Touch
                </Button>
              </Magnetic>
              {resumeUrl && (
                <Magnetic className="max-sm:min-w-0 max-sm:flex-1">
                  <Button
                    variant="secondary"
                    size="lg"
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-foreground/20 bg-foreground/3 rounded-2xl px-4 py-3.5 backdrop-blur-md hover:border-(--brand-mid)/60 hover:bg-(--brand-mid)/10 max-sm:w-full sm:px-7 [@media(max-height:500px)]:py-2"
                  >
                    Resume
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Button>
                </Magnetic>
              )}
            </div>
          </m.div>

          <div
            className={`${styles.socialRow} [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:mt-5 [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:flex [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:items-center [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:gap-5`}
          >
            {iconSocials.length > 0 && (
              <m.div
                {...fadeUp(reduce, 0.9)}
                className={`${styles.socialLinks} mt-5 flex shrink-0 flex-wrap items-center gap-3 [@media(max-height:500px)]:mt-2 [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:mt-0`}
              >
                {iconSocials.map((s) => {
                  const external = s.url.startsWith("http");
                  return (
                    <a
                      key={s.platform}
                      href={s.url}
                      aria-label={s.platform}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group focus-visible:ring-brand-mid/70 rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <IconTile
                        size="md"
                        className="max-sm:[&>span]:size-12 [@media(max-height:500px)]:[&>span]:size-10 [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:rounded-xl [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:[&>span]:rounded-[11px]"
                      >
                        <SocialGlyph
                          platform={s.platform}
                          className="size-9 object-contain drop-shadow-[0_2px_5px_rgb(0_0_0/0.65)] max-sm:size-8 [@media(max-height:500px)]:size-7"
                        />
                      </IconTile>
                    </a>
                  );
                })}
              </m.div>
            )}

            {profile.roles.length > 0 && (
              <m.p
                {...fadeUp(reduce, 1)}
                className={`${styles.roles} text-muted mt-6 font-mono text-[11px] tracking-[0.04em] uppercase md:text-xs md:tracking-[0.14em] [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-[8px] [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:relative [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:-top-1 [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:mt-0`}
              >
                {profile.roles.map((role, i) => (
                  <span key={role}>
                    {i > 0 && " · "}
                    <span className="whitespace-nowrap md:whitespace-normal">{role}</span>
                  </span>
                ))}
              </m.p>
            )}
          </div>

          <m.div
            {...fadeUp(reduce, 1.1)}
            className="glass bg-background/70 mx-auto mt-6 max-w-[240px] rounded-2xl border border-(--brand-mid)/25 px-5 py-4 shadow-[0_0_40px_rgb(var(--brand-mid-rgb)/0.25)] backdrop-blur-md lg:hidden portrait:hidden [@media(max-height:500px)]:hidden"
          >
            <p className="font-mono text-[11px] tracking-[0.25em] text-(--brand-bright)/70 uppercase">
              {"// scope"}
            </p>
            <p className="text-foreground/80 mt-2 text-sm leading-relaxed">
              {FOCUS.map((word, i) => (
                <span key={word}>
                  {i > 0 && <span className="text-(--brand-mid)"> · </span>}
                  {word}
                </span>
              ))}
            </p>
          </m.div>
        </div>
      </div>

      <a
        href="#projects"
        className="text-foreground/50 hover:text-foreground relative z-10 mb-10 flex flex-col items-center gap-2 self-center md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:-translate-x-1/2 [@media(max-height:500px)]:flex-row [@media(orientation:landscape)_and_(max-width:1024px)_and_(max-height:500px)]:translate-y-3"
        aria-label="Scroll to explore, jump to projects"
      >
        <span className="border-foreground/25 flex h-10 w-6 items-start justify-center rounded-full border p-1.5 [@media(max-height:500px)]:h-6 [@media(max-height:500px)]:w-4 [@media(max-height:500px)]:p-1">
          <span className="animate-scroll-dot h-2 w-1 rounded-full bg-(--brand-bright)" />
        </span>
        <span className="text-xs tracking-wide">Scroll to explore</span>
      </a>
    </section>
  );
}

export default Hero;
