"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Merienda } from "next/font/google";
import { m, type Variants } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { ArrowRight, ArrowUpRight, ChevronDown, Mail, RadioTower, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { Magnetic } from "@/components/motion/Magnetic";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import subtitleCss from "./section-subtitle.module.css";
import quoteCss from "./contact-quote.module.css";
import { platformIcon, SocialGlyph, type SocialIcon, type SocialRow } from "./social-icons";

export { platformIcon, type SocialIcon, type SocialRow };

const SUBJECTS = ["Project Collaboration", "Job Opportunity", "Freelance Work", "General Question"];

const quoteFont = Merienda({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

type Card = {
  key: string;
  icon: SocialIcon;
  title: string;
  value: string;
  href: string;
  external: boolean;
};

function cardsFor(socials: SocialRow[], email: string): Card[] {
  const cards: Card[] = [];
  if (email) {
    cards.push({
      key: "email",
      icon: Mail,
      title: "Email",
      value: email,
      href: `mailto:${email}`,
      external: false,
    });
  }
  const linkedin = [...socials]
    .sort((a, b) => a.order - b.order)
    .find((social) => social.platform.toLowerCase() === "linkedin" && social.url);
  if (linkedin) {
    cards.push({
      key: linkedin.platform,
      icon: platformIcon(linkedin.platform),
      title: linkedin.platform,
      value: linkedin.username || linkedin.url.replace(/^https?:\/\//, ""),
      href: linkedin.url,
      external: linkedin.url.startsWith("http"),
    });
  }
  return cards;
}

export function Contact({
  socials,
  email,
  number = "06",
}: {
  socials: SocialRow[];
  email: string;
  number?: string;
}) {
  const cardId = useId();
  const cards = cardsFor(socials, email);
  const { mode } = useAnimationPolicy();
  const linkVariants: Variants = {
    hidden: mode === "static" ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: mode === "static" ? 0 : 0.65,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [quoteFontNear, setQuoteFontNear] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setQuoteFontNear(true));
      return () => cancelAnimationFrame(frame);
    }
    // Start early enough for the quote's font to load before Contact enters view.
    // preload:false alone still fetches a font used by offscreen server-rendered text.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setQuoteFontNear(true);
        observer.disconnect();
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const inputClass =
    "mt-2 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-base text-white placeholder:text-white/50 outline-none transition focus:border-brand-mid/60 focus:bg-black/55 focus:ring-1 focus:ring-brand-mid/30 lg:px-3.5";
  const labelClass = "block text-[13.5px] font-medium text-white/85";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: from, subject, message, website }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setName("");
      setFrom("");
      setSubject("");
      setMessage("");
      setWebsite("");
      setStatus("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Section
      id="contact"
      className="scroll-mt-[80px] pt-4 pb-12 md:pt-6 md:pb-14"
      backdrop={
        <>
          <SectionBackdrop
            frame="desktop-screen"
            video="/media/contact-v3.mp4"
            poster="/media/experience.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/experience-640.webp 640w, /media/experience-960.webp 960w, /media/experience-1600.webp 1600w",
              aspectRatio: 16 / 9,
            }}
            scrim="bg-background/90 absolute inset-0 md:bg-background/90"
          />
          <div
            aria-hidden
            className="from-background/50 pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r via-transparent to-transparent"
          />
          <div
            aria-hidden
            className="from-background pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b to-transparent"
          />
          <div
            aria-hidden
            className="from-background pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t to-transparent"
          />
        </>
      }
    >
      <noscript>
        <style>{`#contact blockquote p { font-family: ${quoteFont.style.fontFamily}; }`}</style>
      </noscript>
      <div
        ref={contentRef}
        className="flex flex-col gap-y-12 lg:flex-row lg:items-start lg:justify-between lg:gap-x-10 [@media(orientation:landscape)_and_(max-height:500px)]:flex-row [@media(orientation:landscape)_and_(max-height:500px)]:items-start [@media(orientation:landscape)_and_(max-height:500px)]:justify-between [@media(orientation:landscape)_and_(max-height:500px)]:gap-x-8 [@media(orientation:landscape)_and_(max-height:500px)]:gap-y-0"
      >
        <div className="min-w-0 lg:w-[42%] lg:max-w-[640px] [@media(orientation:landscape)_and_(max-height:500px)]:w-[42%]">
          <ProgressiveReveal effect="slide">
            <p className={labelCss.label}>
              <span className={labelCss.number}>{number}</span>
              <span>Contact</span>
              <span aria-hidden className={labelCss.rule} />
            </p>

            <h2 className="font-display mt-6 text-[clamp(2rem,3.5vw,3.1rem)] leading-[1.08] font-extrabold tracking-tight text-white">
              Discuss a <span className="gradient-text">project.</span>
            </h2>
          </ProgressiveReveal>

          <ProgressiveReveal effect="fade" desktopDelay={0.08}>
            <p className={`${subtitleCss.subtitle} mt-4 max-w-[475px]`}>
              For infrastructure, automation, web and mobile projects, share your requirements
              below.
            </p>
          </ProgressiveReveal>

          {cards.length > 0 && (
            <ProgressiveReveal
              effect="cascade"
              duration={0}
              delay={0.15}
              staggerChildren={0.18}
              className="mt-9"
            >
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:gap-5 xl:grid-cols-2 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-1 [@media(orientation:landscape)_and_(max-height:500px)]:gap-3">
                {cards.map((card, index) => {
                  return (
                    <m.li key={card.key} initial={false} variants={linkVariants}>
                      <a
                        href={card.href}
                        aria-labelledby={`${cardId}-${index}-title ${cardId}-${index}-value`}
                        {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="group hover:border-brand-mid/45 relative flex h-full items-center gap-2.5 rounded-2xl border border-white/10 bg-(--bg) bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] p-3 transition-colors duration-300 sm:gap-2.5 sm:p-3"
                      >
                        {card.key === "email" ? (
                          <IconTile size="sm">
                            <SocialGlyph
                              platform="gmail"
                              loading="lazy"
                              className="size-6 object-contain drop-shadow-[0_2px_5px_rgb(0_0_0/0.65)]"
                            />
                          </IconTile>
                        ) : (
                          <span className="grid size-9 shrink-0 place-items-center">
                            <SocialGlyph
                              platform={card.title}
                              className="size-8 object-contain drop-shadow-[0_4px_10px_rgb(0_0_0/0.4)]"
                            />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span
                            id={`${cardId}-${index}-title`}
                            className="block pr-6 text-[14px] font-bold text-white capitalize sm:text-[14px]"
                          >
                            {card.title}
                          </span>
                          <span
                            id={`${cardId}-${index}-value`}
                            className={`mt-0.5 block text-[12px] text-white/75 sm:text-[12px] ${card.key === "email" ? "whitespace-nowrap" : "break-words"}`}
                          >
                            {card.value}
                          </span>
                        </span>
                        <ArrowUpRight className="group-hover:text-brand-bright absolute top-3 right-3 size-4 text-white/40 transition-all duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 motion-reduce:transition-none" />
                      </a>
                    </m.li>
                  );
                })}
              </ul>
            </ProgressiveReveal>
          )}
          <ProgressiveReveal
            effect="zoom"
            duration={0.7}
            delay={0.15}
            className="mt-8 max-w-[575px]"
          >
            <figure className="border-brand-mid/20 bg-background/75 rounded-3xl border p-5 shadow-[0_0_32px_-18px_rgb(var(--brand-mid-rgb)/0.12)] backdrop-blur-xl sm:p-6">
              <blockquote cite="https://classics.mit.edu/Plato/republic.3.ii.html">
                <p
                  className={`${quoteFontNear ? quoteFont.className : ""} ${quoteCss.text} text-[12px] leading-[1.55] text-white/90 sm:text-[16px]`}
                >
                  &ldquo;The beginning is the most important part of any work.&rdquo;
                </p>
              </blockquote>
              <figcaption
                className={`${quoteCss.author} mt-3 text-right font-mono text-[12px] font-semibold tracking-[0.12em] text-white/85 uppercase sm:text-[14px]`}
              >
                <span aria-hidden>- </span>
                <cite className="not-italic">
                  <a
                    href="https://classics.mit.edu/Plato/republic.3.ii.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-bright focus-visible:outline-brand-mid rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    Plato
                  </a>
                </cite>
              </figcaption>
            </figure>
          </ProgressiveReveal>
        </div>

        <ProgressiveReveal
          effect="fade-from-right"
          duration={0.75}
          delay={0.15}
          className="min-w-0 lg:w-[49%] lg:max-w-[725px] lg:pt-9 [@media(orientation:landscape)_and_(max-height:500px)]:w-[52%] [@media(orientation:landscape)_and_(max-height:500px)]:pt-0"
        >
          <form
            onSubmit={handleSubmit}
            data-replay-block
            className="rr-block border-brand-mid/20 bg-background/75 relative mx-auto w-full max-w-[535px] rounded-3xl border p-6 shadow-[0_0_50px_-18px_rgb(var(--brand-mid-rgb)/0.24)] backdrop-blur-xl sm:p-8 lg:ml-auto"
          >
            <ProgressiveReveal
              effect="line"
              className="pointer-events-none absolute inset-x-8 top-0 h-px origin-left"
            >
              <span
                aria-hidden
                className="via-brand-mid/60 block h-full bg-gradient-to-r from-transparent to-transparent"
              />
            </ProgressiveReveal>
            <div>
              <div className="flex items-center gap-3">
                <IconTile size="sm">
                  <RadioTower className="size-3.5" {...ICON_PROPS} />
                </IconTile>
                <span className="font-mono text-[11.5px] tracking-[0.3em] text-white/70">
                  SEND A MESSAGE
                </span>
              </div>

              <h3 className="font-display mt-3 text-[clamp(1.85rem,2.6vw,2.6rem)] leading-tight font-extrabold tracking-tight text-white">
                Project <span className="gradient-text">details</span>
              </h3>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelClass}>
                    Your Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    required
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className={labelClass}>
                  Subject
                </label>
                <div className="relative">
                  <select
                    id="contact-subject"
                    name="subject"
                    autoComplete="off"
                    required
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className={`${inputClass} appearance-none pr-10 ${subject ? "text-white" : "text-white/60"}`}
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    {SUBJECTS.map((option) => (
                      <option key={option} value={option} className="bg-background text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-white/40" />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className={labelClass}>
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  autoComplete="off"
                  required
                  minLength={10}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Project scope, current stack, constraints and timeline."
                  className={`${inputClass} h-[92px] resize-none py-2.5`}
                />
              </div>
            </div>

            <div aria-hidden="true" className="absolute top-0 -left-[10000px]">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>
            <p className="text-muted mt-4 text-xs leading-relaxed">
              Read the{" "}
              <Link href="/privacy" className="text-brand-bright underline">
                Privacy policy
              </Link>{" "}
              for details about how your message is handled.
            </p>

            <Magnetic className="mt-5 block w-full">
              <Button
                type="submit"
                disabled={status === "submitting"}
                variant="primary"
                size="lg"
                className="group w-full rounded-2xl px-7 py-3.5 shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.55)] disabled:pointer-events-none"
              >
                <Send className="size-4" aria-hidden />
                {status === "submitting" ? "Sending..." : "Send Message"}
                <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-reduce:transition-none" />
              </Button>
            </Magnetic>

            {status === "success" && (
              <p role="status" className="text-brand-bright mt-3 text-center text-[13px]">
                Message sent. I&apos;ll reply by email.
              </p>
            )}
            {status === "error" && (
              <p role="status" className="mt-3 text-center text-[13px] text-red-300/90">
                {error}
              </p>
            )}
          </form>
        </ProgressiveReveal>
      </div>
    </Section>
  );
}

export default Contact;
