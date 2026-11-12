"use client";

import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import { setMobileMenuOpen } from "@/lib/mobile-menu-state";
import { preload } from "react-dom";
import { SectionLink } from "@/components/common/SectionLink";
import { useHydratedPathname } from "@/hooks/useHydratedPathname";
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
import { subscribeScroll } from "@/lib/scroll-state";
import { sectionNumbers } from "@/lib/section-numbers";
import { NavChapterRail } from "./NavChapterRail";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Logo } from "@/components/brand/Logo";
import { scrollToSection } from "@/lib/scroll-to-section";
import { PORTRAIT_PHONE_QUERY } from "@/lib/motion-queries";
import navStyles from "./nav-landscape.module.css";
import panelStyles from "./nav-panel.module.css";
import chromeStyles from "./nav-chrome.module.css";

/** Past this offset the bar turns to glass and shrinks to its compact height. */
const COMPACT_AFTER = 24;

export type MenuSection = { id: string; label: string };

const SECTION_ICONS: Record<string, LucideIcon> = {
  hero: House,
  about: UserRound,
  skills: CodeXml,
  experience: BriefcaseBusiness,
  projects: FolderCode,
  services: Layers,
  contact: Send,
};

const WORDMARK = {
  src: "/brand/aristache-text.webp",
  width: 704,
  height: 124,
  srcSet:
    "/brand/aristache-text-224.webp 224w, /brand/aristache-text-448.webp 448w, /brand/aristache-text.webp 704w",
  // Short touch landscape uses a smaller wordmark and an 11px root font size.
  sizes:
    "(orientation: landscape) and (max-height: 500px) and (pointer: coarse) min(38vw, 137.5px), min(42vw, 224px)",
} as const;

const SECTIONS: MenuSection[] = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
];

/**
 * Fixed glass bar: mark, inline section links, and a contact CTA. It stays on screen and
 * shrinks to a compact height once the page scrolls. Below xl the same list opens as a panel.
 */
export function SiteNav({
  hidden = [],
  sections = SECTIONS,
  availability,
}: {
  socials: { platform: string; url: string }[];
  availability?: string | null;
  hidden?: string[];
  sections?: MenuSection[];
}) {
  preload(WORDMARK.src, {
    as: "image",
    imageSrcSet: WORDMARK.srcSet,
    imageSizes: WORDMARK.sizes,
    fetchPriority: "high",
  });
  const visibleSections = useMemo(
    () => sections.filter((s) => !hidden.includes(s.id)),
    [sections, hidden],
  );
  const ids = useMemo(() => visibleSections.map((s) => s.id), [visibleSections]);
  const activeSection = useScrollSpy(ids);
  const onHomepage = useHydratedPathname() === "/";
  const active = onHomepage ? activeSection : null;
  const sectionHref = (id: string) => `${onHomepage ? "" : "/"}#${id}`;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [clickedSection, setClickedSection] = useState<string | null>(null);
  const indicatorId = useId();
  const highlightedSection = clickedSection ?? active;
  if (clickedSection !== null && active === clickedSection) {
    setClickedSection(null);
  }
  const [scrolled, setScrolled] = useState(false);
  const numbers = useMemo(
    () => sectionNumbers(Object.fromEntries(hidden.map((id) => [id, false]))),
    [hidden],
  );
  useEffect(() => {
    setMobileMenuOpen(open);
    return () => setMobileMenuOpen(false);
  }, [open]);
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
  const [fadeMenuExit, setFadeMenuExit] = useState(false);
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
      if (open) {
        pendingId.current = id;
        const pair =
          (active === "about" && id === "projects") || (active === "projects" && id === "about");
        // On portrait phones, measuring the height exit can pin the scroll at the source.
        setFadeMenuExit(pair && window.matchMedia(PORTRAIT_PHONE_QUERY).matches);
      } else stopAnchorScroll.current = scrollToSection(id, reduce);
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
  const progressRef = useRef<HTMLSpanElement>(null);
  // One shared per-frame pass: the compact glass state and the progress line. Progress
  // is written straight to the DOM, so scrolling never re-renders the header.
  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty(
        "transform",
        `scaleX(${max > 0 ? Math.min(1, Math.max(0, y / max)) : 0})`,
      );
      setScrolled(y > COMPACT_AFTER);
    };
    update();
    return subscribeScroll(update);
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
            className={`${panelStyles.backdrop} fixed inset-0 z-65 xl:hidden`}
          />
        )}
      </AnimatePresence>
      <m.header
        ref={headerRef}
        initial={false}
        data-shrinks=""
        data-compact={scrolled && !open ? "" : undefined}
        className={cn(
          chromeStyles.header,
          "fixed inset-x-0 top-0 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          // The open menu sits above the consent bar (z-60); the bar returns when it closes.
          open ? "z-70" : "z-50",
          open
            ? "bg-transparent"
            : scrolled
              ? "bg-background/70 border-b border-(--brand-mid)/30 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              : "bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className={`${navStyles.bar} ${chromeStyles.bar} site-container flex h-[72px] items-center justify-between`}
        >
          <SectionLink
            crossPage={!onHomepage}
            scroll={onHomepage}
            href={sectionHref("hero")}
            onClick={(event) => goToSection(event, "hero")}
            aria-label="Home"
            className={cn(
              chromeStyles.brand,
              "flex min-w-0 items-center gap-2.5",
              open && panelStyles.dimmedLogo,
            )}
          >
            <Logo className={cn(navStyles.logo, chromeStyles.mark)} />
            {/* Custom responsive assets share the same candidates as their priority preload. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WORDMARK.src}
              alt=""
              width={WORDMARK.width}
              height={WORDMARK.height}
              srcSet={WORDMARK.srcSet}
              sizes={WORDMARK.sizes}
              fetchPriority="high"
              style={{ aspectRatio: `${WORDMARK.width} / ${WORDMARK.height}` }}
              className={`${navStyles.wordmark} h-auto w-[min(42vw,14rem)]`}
            />
          </SectionLink>

          {availability?.trim() && onHomepage && scrolled && !open && (
            <span className={navStyles.availability}>
              <span aria-hidden className={navStyles.availabilityDot} />
              <span className={navStyles.availabilityText}>{availability}</span>
            </span>
          )}
          <ul className={`${chromeStyles.desktopLinks} hidden items-center gap-8 xl:flex`}>
            {visibleSections.map((section) => {
              const isActive = section.id === active;
              return (
                <li key={section.id}>
                  <SectionLink
                    crossPage={!onHomepage}
                    scroll={onHomepage}
                    href={sectionHref(section.id)}
                    onClick={(event) => {
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        setClickedSection(section.id);
                      }
                      goToSection(event, section.id);
                    }}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      chromeStyles.desktopLink,
                      // The invisible ::before lifts the touch target from the 19px text line to
                      // about 43px (iPads in landscape show this row), inside the 32px gap.
                      "group relative text-[15px] transition-colors before:absolute before:-inset-x-2 before:-inset-y-3",
                      isActive
                        ? "font-medium text-(--brand-bright)"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {section.label}
                    {section.id === highlightedSection && (
                      <m.span
                        aria-hidden
                        layoutId={indicatorId}
                        initial={false}
                        transition={
                          reduce || !clickedSection
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 32, mass: 0.65 }
                        }
                        className={chromeStyles.electricIndicator}
                      >
                        <m.span
                          key={section.id}
                          initial={
                            reduce || !clickedSection ? false : { scaleX: 1.65, opacity: 0.65 }
                          }
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{ duration: reduce ? 0 : 0.32, ease: "easeOut" }}
                          className={chromeStyles.electricCore}
                        />
                      </m.span>
                    )}
                  </SectionLink>
                </li>
              );
            })}
          </ul>

          {navCta && (
            <SectionLink
              crossPage={!onHomepage}
              href={navCta.href}
              onClick={(event) => goToSection(event, "contact")}
              className={`${chromeStyles.cta} ${chromeStyles.desktopCta} group text-foreground focus-visible:ring-brand-mid/70 hidden items-center gap-2 rounded-full border border-(--brand-mid)/40 bg-(--brand-deep)/20 px-5 py-2.5 text-sm font-medium shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.45)] backdrop-blur-md transition-colors hover:bg-(--brand-deep)/35 focus-visible:ring-2 focus-visible:outline-none xl:inline-flex`}
            >
              {navCta.label}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </SectionLink>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => {
              setFadeMenuExit(false);
              setOpen((v) => !v);
            }}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className={`${navStyles.menu} ${chromeStyles.menuButton} border-border bg-background/40 text-foreground flex size-11 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md xl:hidden`}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        <AnimatePresence custom={fadeMenuExit} onExitComplete={scrollToPending}>
          {open && (
            <m.div
              id="mobile-navigation"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              variants={{
                close: (fadeOnly: boolean) =>
                  fadeOnly ? { opacity: 0 } : { height: 0, opacity: 0 },
              }}
              exit={reduce ? undefined : "close"}
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
                          <SectionLink
                            crossPage={!onHomepage}
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
                          </SectionLink>
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
                    <SectionLink
                      crossPage={!onHomepage}
                      href={navCta.href}
                      onClick={(event) => goToSection(event, "contact")}
                      className={panelStyles.cta}
                    >
                      {navCta.label}
                      <ArrowRight className="ml-auto size-4" aria-hidden />
                    </SectionLink>
                  </div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
        {/* Reading progress on the header's bottom edge. Where the chapter rail is shown (xl and up
            on the homepage) the rail already tracks progress, so the line is hidden there. */}
        <span
          ref={progressRef}
          aria-hidden
          className={cn(
            chromeStyles.progress,
            onHomepage && chromeStyles.progressWithRail,
            (!scrolled || open) && chromeStyles.progressIdle,
          )}
        />
      </m.header>
      {onHomepage && (
        <NavChapterRail
          sections={visibleSections.filter((section) => section.id !== "hero")}
          numbers={numbers}
          active={active}
          visible={scrolled && !open}
          onSelect={goToSection}
          hrefFor={sectionHref}
        />
      )}
    </>
  );
}

export default SiteNav;
