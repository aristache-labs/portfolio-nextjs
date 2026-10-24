"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  House,
  UserRound,
  CodeXml,
  BriefcaseBusiness,
  FolderCode,
  Layers,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Logo } from "@/components/brand/Logo";
import { scrollToSection } from "@/lib/scroll-to-section";
import type { MenuSection } from "./MenuOverlay";
import navStyles from "./nav-landscape.module.css";
import panelStyles from "./nav-panel.module.css";

const SECTION_ICONS: Record<string, LucideIcon> = {
  hero: House,
  about: UserRound,
  skills: CodeXml,
  experience: BriefcaseBusiness,
  projects: FolderCode,
  services: Layers,
  contact: Send,
};

const WORDMARK = { src: "/brand/aristache-text.svg", width: 992, height: 175 } as const;

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
  hidden = [],
  sections = SECTIONS,
}: {
  socials: { platform: string; url: string }[];
  hidden?: string[];
  sections?: MenuSection[];
}) {
  const visibleSections = useMemo(
    () => sections.filter((s) => !hidden.includes(s.id)),
    [sections, hidden],
  );
  const ids = useMemo(() => visibleSections.map((s) => s.id), [visibleSections]);
  const activeSection = useScrollSpy(ids);
  const onHomepage = usePathname() === "/";
  const active = onHomepage ? activeSection : null;
  const sectionHref = (id: string) => `${onHomepage ? "" : "/"}#${id}`;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const stopAnchorScroll = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopAnchorScroll.current?.(), [onHomepage]);
  const showContact = visibleSections.some((s) => s.id === "contact");
  const navCta = showContact ? { href: sectionHref("contact"), label: "Let's Talk" } : null;

  // Mobile menu links scroll explicitly, and only after the panel has finished collapsing.
  // Framer Motion measures the height auto -> 0 exit with window.scrollTo(0, 0), which cancels
  // any scroll already in flight, so a scroll started on click never gets anywhere on a phone.
  const pendingId = useRef<string | null>(null);
  const goToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (!onHomepage) {
      setOpen(false);
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      stopAnchorScroll.current?.();
      if (open) pendingId.current = id;
      else stopAnchorScroll.current = scrollToSection(id, reduce);
    }
    setOpen(false);
  };
  const scrollToPending = () => {
    const id = pendingId.current;
    pendingId.current = null;
    const target = document.getElementById(id ?? "");
    if (!id || !target) return;
    stopAnchorScroll.current?.();
    stopAnchorScroll.current = scrollToSection(id, reduce);
  };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        menuButtonRef.current?.focus();
      } else if (e.key === "Tab") {
        const focusable = Array.from(
          headerRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex="0"]',
          ) ?? [],
        ).filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (
          e.shiftKey &&
          (document.activeElement === first || !headerRef.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || !headerRef.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Blurred backdrop behind the mobile menu. Sits outside the header: the header's
          transform would otherwise make this fixed layer position relative to the header. */}
      <AnimatePresence>
        {open && (
          <m.div
            key="menu-backdrop"
            aria-hidden
            onClick={() => setOpen(false)}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            className={`${panelStyles.backdrop} fixed inset-0 z-40 xl:hidden`}
          />
        )}
      </AnimatePresence>
      <m.header
        ref={headerRef}
        initial={reduce ? false : { y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          open
            ? "bg-transparent"
            : scrolled
              ? "bg-background/70 border-b border-(--brand-mid)/30 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              : "bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className={`${navStyles.bar} site-container flex h-[72px] items-center justify-between`}
        >
          <Link
            scroll={onHomepage}
            href={sectionHref("hero")}
            onClick={(event) => goToSection(event, "hero")}
            aria-label="Home"
            className={cn("flex min-w-0 items-center gap-2.5", open && panelStyles.dimmedLogo)}
          >
            <Logo className={navStyles.logo} />
            <Image
              src={WORDMARK.src}
              alt=""
              width={WORDMARK.width}
              height={WORDMARK.height}
              priority
              unoptimized
              className={`${navStyles.wordmark} h-auto w-[min(42vw,14rem)]`}
            />
          </Link>

          <ul className="hidden items-center gap-8 xl:flex">
            {visibleSections.map((section) => {
              const isActive = section.id === active;
              return (
                <li key={section.id}>
                  <Link
                    scroll={onHomepage}
                    href={sectionHref(section.id)}
                    onClick={(event) => goToSection(event, section.id)}
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
                  </Link>
                </li>
              );
            })}
          </ul>

          {navCta && (
            <Link
              href={navCta.href}
              onClick={(event) => goToSection(event, "contact")}
              className="group text-foreground focus-visible:ring-brand-mid/70 hidden items-center gap-2 rounded-full border border-(--brand-mid)/40 bg-(--brand-deep)/20 px-5 py-2.5 text-sm font-medium shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.45)] backdrop-blur-md transition-colors hover:bg-(--brand-deep)/35 focus-visible:ring-2 focus-visible:outline-none xl:inline-flex"
            >
              {navCta.label}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className={`${navStyles.menu} border-border bg-background/40 text-foreground flex size-11 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md xl:hidden`}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        <AnimatePresence onExitComplete={scrollToPending}>
          {open && (
            <m.div
              id="mobile-navigation"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
              className={`${navStyles.panel} ${panelStyles.panel} border-border bg-background/95 max-h-[calc(100dvh-72px)] overflow-x-hidden overflow-y-auto overscroll-contain border-t backdrop-blur-xl xl:hidden`}
            >
              <div className={`site-container ${panelStyles.content}`}>
                <nav aria-label="Mobile navigation">
                  <p className={panelStyles.eyebrow}>Explore the portfolio</p>
                  <ul className={panelStyles.links}>
                    {visibleSections.map((section) => {
                      const Icon = SECTION_ICONS[section.id] ?? Layers;
                      return (
                        <li key={section.id} data-section={section.id}>
                          <Link
                            scroll={onHomepage}
                            href={sectionHref(section.id)}
                            data-testid="mobile-section-link"
                            aria-current={section.id === active ? "location" : undefined}
                            onClick={(e) => goToSection(e, section.id)}
                            className={cn(
                              panelStyles.link,
                              section.id === active && panelStyles.active,
                            )}
                          >
                            <span aria-hidden className={panelStyles.icon}>
                              <Icon size={19} strokeWidth={1.6} />
                            </span>
                            <span>{section.label}</span>
                            <ArrowUpRight aria-hidden className={panelStyles.arrow} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                {navCta && (
                  <div className={panelStyles.action}>
                    <p className={panelStyles.eyebrow}>Project inquiries</p>
                    <p className={panelStyles.actionTitle}>Discuss your project.</p>
                    <p className={panelStyles.actionDescription}>
                      Share the scope, stack and timeline.
                    </p>
                    <Link
                      href={navCta.href}
                      onClick={(event) => goToSection(event, "contact")}
                      className={panelStyles.cta}
                    >
                      {navCta.label}
                      <ArrowRight className="ml-auto size-4" aria-hidden />
                    </Link>
                  </div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.header>
    </>
  );
}

export default SiteNav;
