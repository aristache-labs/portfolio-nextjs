"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Merienda } from "next/font/google";
import { AnimatePresence, m, type Variants } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { ArrowRight, ArrowUpRight, Loader2, Mail, RadioTower, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { Magnetic } from "@/components/motion/Magnetic";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import subtitleCss from "./section-subtitle.module.css";
import headingCss from "./section-heading.module.css";
import quoteCss from "./contact-quote.module.css";
import formCss from "./contact-form.module.css";
import motionCss from "./contact-motion.module.css";
import { CONTACT_PORTRAIT_QUERY, CONTACT_LANDSCAPE_QUERY, ContactArrival } from "./ContactArrival";
import { platformIcon, SocialGlyph, type SocialIcon, type SocialRow } from "./social-icons";
import { GLASS_CARD } from "./project-styles";
import { ContactSubject } from "./ContactSubject";
import { cn } from "@/utils/cn";
import { CONTACT_SUBJECTS } from "@/lib/contact-subjects";

export { platformIcon, type SocialIcon, type SocialRow };

const SUBJECTS = [...CONTACT_SUBJECTS];
/** How long the thank-you stays over the form before it can send again. */
const SENT_CONFIRMATION_MS = 4500;

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

const QUOTE_GLASS = `${GLASS_CARD} rounded-3xl border p-5 sm:p-6`;
const FORM_COLUMN =
  "min-w-0 lg:w-[49%] lg:max-w-[725px] lg:pt-9 [@media(orientation:landscape)_and_(max-height:500px)]:w-[52%] [@media(orientation:landscape)_and_(max-height:500px)]:pt-0";
/** Same glass as the other cards, set apart by a fine brand border and a soft glow. */
const FORM_GLASS = cn(
  GLASS_CARD,
  "mx-auto max-w-[535px] rounded-3xl border border-(--brand-mid)/25 shadow-[0_0_48px_-24px_rgb(var(--brand-mid-rgb)/0.45)] lg:ml-auto",
);

/** The contact cards cascade in on a timer, unless the desktop scene drives each card. */
function CardList({ scene, children }: { scene: boolean; children: ReactNode }) {
  return (
    <ContactArrival
      kind="list"
      mobile={false}
      plain={scene}
      effect="cascade"
      duration={0}
      delay={0.15}
      staggerChildren={0.18}
      className="mt-9"
    >
      {children}
    </ContactArrival>
  );
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
  const [justSent, setJustSent] = useState(false);
  const [shaking, setShaking] = useState(false);
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

  const scene = useMediaQuery(PINNED_SCENE_QUERY) && mode === "expressive";
  const portrait = useMediaQuery(CONTACT_PORTRAIT_QUERY);
  const landscape = useMediaQuery(CONTACT_LANDSCAPE_QUERY);
  const mobile = portrait || landscape;
  const cssCards = scene || mobile;
  useLayoutEffect(() => {
    if (!cssCards) return;
    contentRef.current
      ?.querySelectorAll<HTMLAnchorElement>("a[aria-labelledby]")
      .forEach((link) => {
        link.style.opacity = "";
      });
  }, [cssCards]);
  /** From the left with scrolling on expressive desktops, the timed reveal elsewhere. */
  const leftArrival = (effect: "slide" | "fade", lag: number, content: ReactNode) => (
    <ContactArrival
      mobile={mobile}
      scrollFrom={scene ? "left" : undefined}
      scrollLag={lag}
      kind={effect === "slide" ? "heading" : "description"}
      effect={effect}
      desktopDelay={effect === "fade" ? 0.08 : 0.3}
    >
      {content}
    </ContactArrival>
  );
  // Keep each glass surface on the layer faded by its active driver.
  const quoteFrame = (content: ReactNode) => (
    <ContactArrival
      kind="quote"
      mobile={mobile}
      scrollFrom={scene ? "left" : undefined}
      scrollLag={0.14}
      effect="zoom"
      duration={0.7}
      delay={0.15}
      className="mt-8 max-w-[575px]"
      surfaceClassName={QUOTE_GLASS}
    >
      {content}
    </ContactArrival>
  );
  const formFrame = (content: ReactNode) => (
    <ContactArrival
      kind="form"
      mobile={mobile}
      scrollFrom={scene ? "right" : undefined}
      scrollLag={0.05}
      effect="fade-from-right"
      duration={0.75}
      delay={0.15}
      className={FORM_COLUMN}
      surfaceClassName={FORM_GLASS}
    >
      {content}
    </ContactArrival>
  );

  const inputClass =
    "mt-2 h-10 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-base text-white placeholder:text-white/50 outline-none transition focus:border-brand-mid/60 focus:bg-black/55 focus:ring-1 focus:ring-brand-mid/30 lg:px-3.5";
  const labelClass = "block text-[13.5px] font-medium text-white/85";

  // The send button confirms a delivered message for a moment, then offers sending again.
  useEffect(() => {
    if (!justSent) return;
    const timer = setTimeout(() => setJustSent(false), SENT_CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [justSent]);

  /** Shows the error and gives the form a short shake (CSS, skipped with reduced motion). */
  function fail(text: string) {
    setError(text);
    setStatus("error");
    setShaking(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!subject) {
      fail("Please select a subject.");
      document.getElementById("contact-subject")?.focus();
      return;
    }
    inFlight.current = true;
    setStatus("submitting");
    setError("");
    setJustSent(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: from, subject, message, website }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        fail(body?.error || "Something went wrong. Please try again.");
        return;
      }
      setName("");
      setFrom("");
      setSubject("");
      setMessage("");
      setWebsite("");
      setStatus("success");
      setJustSent(true);
    } catch {
      fail("Something went wrong. Please try again.");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <Section
      id="contact"
      className={`${motionCss.section} scroll-mt-[80px] pt-4 pb-12 md:pt-6 md:pb-14`}
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
          {leftArrival(
            "slide",
            0,
            <div>
              <p className={`${labelCss.label} ${headingCss.label}`}>
                <span className={labelCss.number}>{number}</span>
                <span>Contact</span>
                <span aria-hidden className={labelCss.rule} />
              </p>

              {/* Same scale and weight as the other section headings. */}
              <h2 className={headingCss.title}>
                Discuss a <span className={headingCss.accent}>project</span>.
              </h2>
            </div>,
          )}

          {leftArrival(
            "fade",
            0.03,
            <p className={`${subtitleCss.subtitle} mt-4 max-w-[475px]`}>
              For infrastructure, automation, web and mobile projects, share your requirements
              below.
            </p>,
          )}

          {cards.length > 0 && (
            <CardList scene={scene || mobile}>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:gap-5 xl:grid-cols-2 [@media(orientation:landscape)_and_(max-height:500px)]:grid-cols-1 [@media(orientation:landscape)_and_(max-height:500px)]:gap-3">
                {cards.map((card, index) => {
                  const link = (
                    // The card fades itself, so its glass blur shows from the first frame.
                    // Motion must not own opacity here: an empty target is not animatable,
                    // and an inline opacity would hide the glass fade.
                    <m.a
                      initial={false}
                      variants={cssCards ? undefined : linkVariants}
                      animate={cssCards ? { x: 0 } : undefined}
                      transformTemplate={cssCards ? () => "" : undefined}
                      href={card.href}
                      aria-labelledby={`${cardId}-${index}-title ${cardId}-${index}-value`}
                      {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`${GLASS_CARD} group hover:border-brand-mid/45 relative flex h-full items-center gap-2.5 rounded-2xl border p-3 transition-colors duration-300 sm:gap-2.5 sm:p-3`}
                    >
                      {card.key === "email" ? (
                        <IconTile size="sm">
                          <SocialGlyph
                            platform="email"
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
                    </m.a>
                  );
                  return (
                    <li key={card.key}>
                      <ContactArrival
                        kind="card"
                        mobile={mobile}
                        plain
                        scrollFrom={scene ? "left" : undefined}
                        scrollLag={0.06 + index * 0.04}
                        order={index}
                        className="h-full"
                      >
                        {link}
                      </ContactArrival>
                    </li>
                  );
                })}
              </ul>
            </CardList>
          )}
          {quoteFrame(
            <figure>
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
            </figure>,
          )}
        </div>

        {formFrame(
          <form
            onSubmit={handleSubmit}
            data-replay-block
            data-shaking={shaking ? "" : undefined}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setShaking(false);
            }}
            className={`${formCss.form} rr-block relative w-full p-6 sm:p-8`}
          >
            <ProgressiveReveal
              effect="line"
              className="pointer-events-none absolute inset-x-8 top-0 h-px origin-left"
            >
              <span
                aria-hidden
                className="via-brand-mid block h-full bg-gradient-to-r from-transparent to-transparent"
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

              <h3 className="font-display mt-3 text-xl leading-snug font-medium tracking-[-0.02em] text-white">
                Project <span className="text-brand-mid">details</span>
              </h3>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className={formCss.group} data-contact-step>
                  <label htmlFor="contact-name" className={labelClass}>
                    Your Name
                  </label>
                  <div className={formCss.field}>
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
                    <span aria-hidden className={formCss.focusLine} />
                  </div>
                </div>
                <div className={formCss.group} data-contact-step>
                  <label htmlFor="contact-email" className={labelClass}>
                    Your Email
                  </label>
                  <div className={formCss.field}>
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
                    <span aria-hidden className={formCss.focusLine} />
                  </div>
                </div>
              </div>

              <div className={formCss.group} data-contact-step>
                <label htmlFor="contact-subject" className={labelClass}>
                  Subject
                </label>
                <div className={formCss.field}>
                  <ContactSubject
                    id="contact-subject"
                    value={subject}
                    options={SUBJECTS}
                    onChange={setSubject}
                    className={`${inputClass} pr-3.5`}
                  />
                  <span aria-hidden className={formCss.focusLine} />
                </div>
              </div>

              <div className={formCss.group} data-contact-step>
                <label htmlFor="contact-message" className={labelClass}>
                  Message
                </label>
                <div className={formCss.field}>
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
                  <span aria-hidden className={formCss.focusLine} />
                </div>
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
                data-contact-step
                disabled={status === "submitting"}
                variant="primary"
                size="md"
                className="group w-full rounded-xl py-2.5 shadow-[0_6px_18px_-10px_rgb(var(--brand-deep-rgb)/0.5)] disabled:pointer-events-none"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                    Sending...
                  </>
                ) : justSent ? (
                  <>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`${formCss.check} size-4`}
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    Message sent
                  </>
                ) : (
                  <>
                    <Send className="size-4" aria-hidden />
                    Send Message
                    <ArrowRight className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-reduce:transition-none" />
                  </>
                )}
              </Button>
            </Magnetic>

            {status === "success" && (
              <p
                role="status"
                className={`${formCss.status} text-brand-bright mt-3 text-center text-[13px]`}
              >
                Message sent. I&apos;ll reply by email.
              </p>
            )}
            {status === "error" && (
              <p
                role="status"
                className={`${formCss.status} mt-3 text-center text-[13px] text-red-300/90`}
              >
                {error}
              </p>
            )}

            {/* A short thank-you over the form. The status line above carries the same news
                for assistive technology, so this copy is hidden from it. */}
            <AnimatePresence>
              {justSent && (
                <m.div
                  key="sent"
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: mode === "static" ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`${formCss.sent} absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-(--overlay-bg) px-6 text-center backdrop-blur-xl`}
                >
                  <span className="border-brand-mid/40 bg-brand-mid/10 grid size-16 place-items-center rounded-full border">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`${formCss.bigCheck} text-brand-bright size-8`}
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <p className="font-display mt-4 text-xl font-medium text-white">Thank you</p>
                  <p className="mt-1 text-sm text-white/70">
                    Message sent. I&apos;ll reply by email.
                  </p>
                </m.div>
              )}
            </AnimatePresence>
          </form>,
        )}
      </div>
    </Section>
  );
}

export default Contact;
