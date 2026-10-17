"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Logo } from "@/components/brand/Logo";
import type { MenuSection } from "./MenuOverlay";

const SECTIONS: MenuSection[] = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
];

/**
 * Fixed glass bar: mark, inline section links, and a contact CTA.
 * The mobile panel is the same list, not a full-screen overlay.
 */
export function SiteNav({
  name,
  socials,
  hidden = [],
  sections = SECTIONS,
}: {
  name?: string;
  socials: { platform: string; url: string }[];
  hidden?: string[];
  sections?: MenuSection[];
}) {
  const visibleSections = useMemo(
    () => sections.filter((s) => !hidden.includes(s.id)),
    [sections, hidden],
  );
  const ids = useMemo(() => visibleSections.map((s) => s.id), [visibleSections]);
  const active = useScrollSpy(ids);
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showContact = visibleSections.some((s) => s.id === "contact");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <motion.header
      initial={reduce ? false : { y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/70 border-b border-(--brand-mid)/30 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="site-container flex h-[72px] items-center justify-between"
      >
        <a href="#hero" aria-label="Home" className="flex items-center gap-2.5">
          <Logo />
          {name ? (
            <span className="font-display text-foreground text-xl font-semibold tracking-tight">
              {name}
            </span>
          ) : null}
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {visibleSections.map((section) => {
            const isActive = section.id === active;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "group relative text-[15px] transition-colors",
                    isActive
                      ? "font-medium text-(--brand-bright)"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {section.label}
                  <span
                    className={cn(
                      "absolute -bottom-2 left-0 h-[2px] rounded-full bg-linear-to-r from-(--brand-mid) to-(--brand-bright) transition-all duration-300",
                      isActive
                        ? "w-full shadow-[0_0_12px_rgb(var(--brand-mid-rgb)/0.9)]"
                        : "w-0 group-hover:w-full",
                    )}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {showContact && (
          <a
            href="#contact"
            className="group text-foreground hidden items-center gap-2 rounded-full border border-(--brand-mid)/40 bg-(--brand-deep)/20 px-5 py-2.5 text-sm font-medium shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.45)] backdrop-blur-md transition-colors hover:bg-(--brand-deep)/35 lg:inline-flex"
          >
            Let&apos;s Connect
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="border-border bg-background/40 text-foreground flex size-11 items-center justify-center rounded-xl border backdrop-blur-md lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
            className="border-border bg-background/80 overflow-hidden border-t backdrop-blur-xl lg:hidden"
          >
            <ul className="site-container space-y-1 py-4">
              {visibleSections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    data-testid="mobile-section-link"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-[15px] transition-colors",
                      section.id === active
                        ? "bg-(--brand-mid)/15 text-(--brand-bright)"
                        : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
              {socials.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    className="text-foreground/75 hover:text-foreground block rounded-lg px-3 py-2.5 text-[15px]"
                  >
                    {s.platform}
                  </a>
                </li>
              ))}
              {showContact && (
                <li className="pt-2">
                  <a
                    href="#contact"
                    onClick={() => setOpen(false)}
                    className="text-foreground flex items-center justify-center gap-2 rounded-xl bg-(--brand-deep) px-5 py-3 text-sm font-semibold"
                  >
                    Let&apos;s Connect <ArrowRight className="size-4" />
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default SiteNav;
