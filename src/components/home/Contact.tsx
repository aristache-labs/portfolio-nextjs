"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Mail, RadioTower, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { Magnetic } from "@/components/motion/Magnetic";
import { SectionBackdrop } from "./SectionBackdrop";
import { platformIcon, type SocialIcon, type SocialRow } from "./social-icons";

export { platformIcon, type SocialIcon, type SocialRow };

const SUBJECTS = ["Project Collaboration", "Job Opportunity", "Freelance Work", "General Question"];

const EASE = [0.22, 1, 0.36, 1] as const;

type Card = {
  key: string;
  icon: SocialIcon;
  title: string;
  value: string;
  href: string;
  external: boolean;
  label: string;
};

function cardsFor(socials: SocialRow[], email: string): Card[] {
  const cards: Card[] = [];
  for (const social of [...socials].sort((a, b) => a.order - b.order)) {
    if (social.platform.toLowerCase() === "email") continue;
    cards.push({
      key: social.platform,
      icon: platformIcon(social.platform),
      title: social.platform,
      value: social.username || social.url.replace(/^https?:\/\//, ""),
      href: social.url,
      external: social.url.startsWith("http"),
      label: `${social.platform}: ${social.username}`,
    });
  }
  if (email) {
    cards.push({
      key: "email",
      icon: Mail,
      title: "Email",
      value: email,
      href: `mailto:${email}`,
      external: false,
      label: `Email ${email}`,
    });
  }
  return cards;
}

export function Contact({ socials, email }: { socials: SocialRow[]; email: string }) {
  const cards = cardsFor(socials, email);
  const pills = cards.filter((card) => card.external);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  const inputClass =
    "mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-[14px] text-white placeholder:text-white/35 outline-none transition focus:border-brand-mid/60 focus:bg-black/55 focus:ring-1 focus:ring-brand-mid/30 lg:px-3.5";
  const labelClass = "block text-[13.5px] font-medium text-white/75";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: from, subject, message }),
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
      className="scroll-mt-24 pt-4 md:pt-6"
      backdrop={
        <>
          <SectionBackdrop
            video="/media/contact.mp4"
            poster="/media/contact.webp"
            scrim="bg-background/70 absolute inset-0"
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
      <div className="flex flex-col gap-y-12 md:flex-row md:items-start md:justify-between md:gap-x-10">
        <div className="min-w-0 md:w-[47%] lg:w-[38%] lg:max-w-[560px]">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-muted mb-4 flex items-center gap-4 font-mono text-xs tracking-[0.3em] uppercase"
          >
            <span>
              <span className="gradient-text mr-3 font-semibold">06</span>
              Contact
            </span>
            <span aria-hidden className="bg-border h-px flex-1" />
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="font-display mt-6 text-[clamp(2rem,3.5vw,3.1rem)] leading-[1.08] font-extrabold tracking-tight text-white"
          >
            Great&apos; Ideas Start with a <span className="gradient-text">Conversation.</span>
            <br />
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-4 max-w-[475px] text-[16.5px] leading-[1.62] text-white/75 sm:text-[17px]"
          >
            Have a project in mind, a technical challenge to solve, or an opportunity to
            collaborate? Whether it's IT infrastructure, automation, web, or mobile development, I'd
            love to hear from you..
          </motion.p>

          <ul className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.li
                  key={card.key}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: 0.25 + index * 0.1, ease: EASE }}
                >
                  <a
                    href={card.href}
                    aria-label={card.label}
                    {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group hover:border-brand-mid/45 relative flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-(--bg) bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] p-3.5 transition-colors duration-300 sm:gap-3.5 sm:p-4"
                  >
                    <IconTile size="sm">
                      <Icon className="size-[18px]" {...ICON_PROPS} />
                    </IconTile>
                    <span className="min-w-0">
                      <span className="block pr-6 text-[14px] font-bold text-white capitalize sm:text-[15px]">
                        {card.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] break-words text-white/55 sm:text-[13px]">
                        {card.value}
                      </span>
                    </span>
                    <ArrowUpRight className="group-hover:text-brand-bright absolute top-3 right-3 size-4 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </motion.li>
              );
            })}
          </ul>

          <motion.figure
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
            className="mt-8 lg:mt-10"
          >
            <blockquote className="[font-family:var(--font-hand),cursive] text-[28px] leading-tight text-white drop-shadow-[0_2px_14px_rgb(0_0_0/0.65)] sm:text-[26px] lg:text-[28px]">
              &ldquo;Every great solution starts with a conversation.&rdquo;
            </blockquote>
            <footer className="mt-2 font-mono text-[14px] tracking-[0.3em] text-white/55">
              - ADRIAN
            </footer>
          </motion.figure>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="min-w-0 md:w-[49%] lg:w-[49%] lg:max-w-[725px] lg:pt-9"
        >
          <form
            onSubmit={handleSubmit}
            className="border-brand-mid/20 bg-background/75 mx-auto w-full max-w-[535px] rounded-3xl border p-6 shadow-[0_0_70px_-15px_rgb(var(--brand-mid-rgb)/0.4)] backdrop-blur-xl sm:p-8 md:ml-auto"
          >
            <div className="flex items-center gap-3">
              <IconTile size="sm">
                <RadioTower className="size-3.5" {...ICON_PROPS} />
              </IconTile>
              <span className="font-mono text-[11.5px] tracking-[0.3em] text-white/70">
                SEND A MESSAGE
              </span>
            </div>

            <h3 className="font-display mt-3 text-[clamp(1.85rem,2.6vw,2.6rem)] leading-tight font-extrabold tracking-tight text-white">
              I&apos;m all <span className="gradient-text">ears!</span>
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-white/60">
              Fill out the form and I&apos;ll get back to you as soon as I can.
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>
                    Your Name
                  </label>
                  <input
                    id="contact-name"
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
                  required
                  minLength={10}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell me about the project, the role, or the problem."
                  className={`${inputClass} h-[92px] resize-none py-2.5`}
                />
              </div>
            </div>

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
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
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

          {pills.length > 0 && (
            <div className="mx-auto mt-8 w-full max-w-[535px] md:ml-auto">
              <p className="font-mono text-[11.5px] tracking-[0.3em] text-white/60">
                OTHER WAYS TO CONNECT
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {pills.map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <a
                      key={pill.key}
                      href={pill.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:border-brand-mid/50 hover:bg-brand-mid/12 bg-background/65 group flex h-[42px] items-center gap-2.5 rounded-full border border-white/10 px-5 text-[14px] font-medium text-white/85 backdrop-blur-md transition-all duration-300 hover:text-white hover:shadow-[0_0_24px_rgb(var(--brand-mid-rgb)/0.25)]"
                    >
                      <Icon className="text-brand-bright size-4" aria-hidden />
                      <span className="capitalize">{pill.title}</span>
                      <ArrowRight className="size-3.5 text-white/45 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Section>
  );
}

export default Contact;
