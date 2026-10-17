"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { SocialGlyph } from "./social-icons";
import { SectionEdge } from "./SectionBackdrop";
export type HeroProfile = {
  name: string;
  roles: string[];
};

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_COPY =
  "I build modern applications, reliable systems, and thoughtful digital experiences that solve real problems and create lasting value.";
const FOCUS = ["Build", "Learn", "Improve", "Repeat"] as const;
const GREETING = "// HELLO, I'M";
/** Cover-fit box for the 16:9 hero plate, centered in its size container. */
const PLATE =
  "absolute top-1/2 left-1/2 aspect-video w-[max(100cqw,calc(100cqh*16/9))] -translate-x-1/2 -translate-y-1/2";

function useTypewriter(text: string, reduce: boolean) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length && interval) clearInterval(interval);
      }, 55);
    }, 400);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, reduce]);

  return reduce ? text : out;
}

function fadeUp(reduce: boolean, delay: number) {
  return {
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
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
  const typed = useTypewriter(GREETING, reduce);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const sectionRef = useRef<HTMLElement>(null);
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
  // hero.mp4 never competes with hero.webp. Phones never mount the video.
  const mountVideo = showVideo && isDesktop && (posterLoaded || !posterOk);

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
      className="relative flex scroll-mt-24 flex-col justify-start overflow-hidden md:min-h-[min(100svh,56rem)] md:justify-center"
    >
      <div
        className="[container-type:size] pointer-events-none absolute inset-0 z-0 overflow-hidden"
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
            className="absolute inset-0 h-full w-full object-cover md:hidden"
          />
        )}
        <div className="bg-background/70 absolute inset-0 md:hidden" />
        {/* Desktop plate: sized exactly like object-cover on a 16:9 picture, so anything placed
            inside it by percentage stays on the same spot of the picture at any screen size. */}
        <div className={`${PLATE} hidden md:block`}>
          {/* The poster img is the LCP candidate and stays put: the video mounts above it, so the
              swap never creates a later, same-size LCP element. */}
          {posterOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/media/hero.webp"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
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
          <motion.div className="absolute inset-0 hidden md:block" style={{ background: spotBg }} />
        )}
        <div className="hero-noise absolute inset-0" />
        <SectionEdge edge="bottom" />
        <div className={`${PLATE} hidden lg:block`}>
          <motion.div
            {...fadeUp(reduce, 0.85)}
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="animate-float-slow glass bg-background/70 absolute top-[51%] left-[74.7%] max-w-[240px] rounded-2xl border border-(--brand-mid)/25 px-5 py-4 shadow-[0_0_40px_rgb(var(--brand-mid-rgb)/0.25)] backdrop-blur-md"
          >
            <p className="font-mono text-[11px] tracking-[0.25em] text-(--brand-bright)/70 uppercase">
              {"// focus"}
            </p>
            <p className="text-foreground/80 mt-2 text-sm leading-relaxed">
              {FOCUS.map((word, i) => (
                <span key={word}>
                  {i > 0 && <span className="text-(--brand-mid)"> · </span>}
                  {word}
                </span>
              ))}
            </p>
          </motion.div>
        </div>
      </div>

      {showVideo && (
        <button
          type="button"
          onClick={toggleVideo}
          aria-label={playing ? "Pause background video" : "Play background video"}
          className="border-border bg-background/40 text-foreground/70 hover:text-foreground absolute right-6 bottom-24 z-20 hidden size-10 items-center justify-center rounded-full border backdrop-blur-md md:flex"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      )}

      <div className="site-container relative z-10 grid items-center gap-10 pt-28 pb-8 md:pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="max-w-2xl min-w-0 lg:pl-8">
          <motion.p
            {...fadeUp(reduce, 0.15)}
            className="mb-3 font-mono text-[13px] tracking-[0.35em] text-(--brand-bright)/90"
          >
            {typed}
            <span
              aria-hidden
              className="animate-blink ml-1 inline-block h-4 w-[2px] translate-y-[3px] bg-(--brand-bright)"
            />
          </motion.p>

          <h1 className="max-w-3xl">
            <motion.span
              {...fadeUp(reduce, 0.3)}
              className="font-display block cursor-default bg-[linear-gradient(92deg,#f7fffd_6%,#76f5e1_46%,#58e5d0_82%)] bg-clip-text text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.95] font-extrabold tracking-tight text-transparent"
            >
              {profile.name.replace(/\bCristache\b\s*/i, "").trim()}
            </motion.span>
            <motion.span
              {...fadeUp(reduce, 0.45)}
              className="font-display mt-3 block text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.08] font-bold tracking-tight"
            >
              Technology, <br />
              built with <span className="text-(--brand-mid)">intention.</span>
            </motion.span>
          </h1>

          <motion.p
            {...fadeUp(reduce, 0.6)}
            className="text-foreground/65 mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base"
          >
            {HERO_COPY}
          </motion.p>

          {heroTagline && (
            <motion.p {...fadeUp(reduce, 0.7)} className="mt-4">
              <span className="border-border bg-background/40 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase backdrop-blur-sm">
                <span
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-(image:--gradient-brand) shadow-[0_0_8px_2px_rgb(var(--brand-mid-rgb)/0.6)] motion-reduce:animate-none"
                />
                {heroTagline}
              </span>
            </motion.p>
          )}

          <motion.div
            {...fadeUp(reduce, 0.8)}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          >
            <Magnetic className="max-sm:w-full">
              <Button
                variant="primary"
                size="lg"
                href="#projects"
                className="rounded-2xl px-7 py-3.5 shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.55)] max-sm:w-full"
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
                  className="border-foreground/20 bg-foreground/3 rounded-2xl px-4 py-3.5 backdrop-blur-md hover:border-(--brand-mid)/60 hover:bg-(--brand-mid)/10 max-sm:w-full sm:px-7"
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
                    className="border-foreground/20 bg-foreground/3 rounded-2xl px-4 py-3.5 backdrop-blur-md hover:border-(--brand-mid)/60 hover:bg-(--brand-mid)/10 max-sm:w-full sm:px-7"
                  >
                    Resume
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Button>
                </Magnetic>
              )}
            </div>
          </motion.div>

          {iconSocials.length > 0 && (
            <motion.div {...fadeUp(reduce, 0.9)} className="mt-5 flex flex-wrap items-center gap-3">
              {iconSocials.map((s) => {
                const external = s.url.startsWith("http");
                return (
                  <a
                    key={s.platform}
                    href={s.url}
                    aria-label={s.platform}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="border-border bg-foreground/5 text-foreground/80 hover:text-foreground focus-visible:ring-brand-mid/70 grid size-12 place-items-center rounded-2xl border backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:border-(--brand-mid)/50 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <SocialGlyph platform={s.platform} className="size-6 object-contain" />
                  </a>
                );
              })}
            </motion.div>
          )}

          {profile.roles.length > 0 && (
            <motion.p
              {...fadeUp(reduce, 1)}
              className="text-muted mt-4 font-mono text-[11px] tracking-[0.04em] uppercase md:text-xs md:tracking-[0.14em]"
            >
              {profile.roles.map((role, i) => (
                <span key={role}>
                  {i > 0 && " / "}
                  <span className="whitespace-nowrap md:whitespace-normal">{role}</span>
                </span>
              ))}
            </motion.p>
          )}
        </div>
      </div>

      <a
        href="#projects"
        className="text-foreground/50 hover:text-foreground absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        aria-label="Scroll to projects"
      >
        <span className="border-foreground/25 flex h-10 w-6 items-start justify-center rounded-full border p-1.5">
          <span className="animate-scroll-dot h-2 w-1 rounded-full bg-(--brand-bright)" />
        </span>
        <span className="text-xs tracking-wide">Scroll to explore</span>
      </a>
    </section>
  );
}

export default Hero;
