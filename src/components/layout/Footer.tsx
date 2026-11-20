"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionLink } from "@/components/common/SectionLink";
import { m, type Variants } from "framer-motion";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { FooterPart } from "./FooterPart";
import type { SocialRow } from "@/components/home/social-icons";
import { GLASS_CARD } from "@/components/home/project-styles";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import subtitleCss from "@/components/home/section-subtitle.module.css";
import headingCss from "@/components/home/section-heading.module.css";
import { PREFERENCES_EVENT } from "@/lib/analytics-consent";
import { SITE } from "@/lib/seo/site";
import { scrollToSection } from "@/lib/scroll-to-section";
import layout from "./footer-layout.module.css";
import wordsCss from "./footer-words.module.css";
import { useEntranceOnce } from "@/hooks/useEntranceOnce";
import entranceCss from "./footer-entrance.module.css";

/** Longest entrance in footer-entrance.module.css (delay plus duration), with a little to spare. */
const FOOTER_ENTRANCE_MS = 2000;
import { useFooterEntrance } from "./useFooterEntrance";
import { FOOTER_MOBILE_QUERY, useFooterMobileEntrance } from "./useFooterMobileEntrance";
import mobileCss from "./footer-mobile-motion.module.css";

const LINKS = [
  { label: "Home", href: "#hero", group: "explore" },
  { label: "About", href: "#about", group: "explore" },
  { label: "Projects", href: "#projects", group: "explore" },
  { label: "Skills", href: "#skills", group: "explore" },
  { label: "Experience", href: "#experience", group: "work" },
  { label: "Services", href: "#services", group: "work" },
  { label: "Contact", href: "#contact", group: "work" },
];

const HEADING = "font-display text-[15px] font-medium tracking-[-0.01em] text-white/90";
const FOCUS =
  "focus-visible:ring-brand-mid/70 focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

const COLUMN_LINK = `${layout.columnLink} flex min-h-11 w-full items-center rounded-md py-1 text-left text-[14px] text-white/80 transition-colors duration-200 hover:text-white sm:min-h-9 md:text-[15px] ${FOCUS}`;

export function Footer({
  sponsorUrl,
  heroTagline,
  sectionVisibility = {},
  homeHrefPrefix = "",
}: {
  socials: SocialRow[];
  email?: string | null;
  sponsorUrl?: string | null;
  heroTagline?: string | null;
  sectionVisibility?: Record<string, boolean>;
  homeHrefPrefix?: string;
}) {
  const year = new Date().getFullYear();
  const legalLinks = [
    { label: "Privacy", href: "/privacy", external: false },
    { label: "GDPR", href: "/gdpr", external: false },
  ];
  const visibleLinks = LINKS.filter(
    (link) => link.href === "#hero" || sectionVisibility[link.href.slice(1)] !== false,
  ).map((link) => ({ ...link, href: `${homeHrefPrefix}${link.href}`, external: false }));
  const supportUrl = sponsorUrl?.trim();
  const supportLink = supportUrl
    ? { label: "Buy me a coffee", href: supportUrl, external: true }
    : null;
  const { mode } = useAnimationPolicy();
  // Footer section links glide like the header links do. Left to the browser, the first click\n  // only rewrites the hash and the page stays put until a second click.
  const stopAnchorScroll = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stopAnchorScroll.current?.(), []);
  const glideToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (homeHrefPrefix || !document.getElementById(id)) return;
    event.preventDefault();
    stopAnchorScroll.current?.();
    stopAnchorScroll.current = scrollToSection(id, mode === "static");
  };
  const itemVariants: Variants = {
    hidden: mode === "static" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: mode === "static" ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const footer = useRef<HTMLElement>(null);
  const scene = useMediaQuery(PINNED_SCENE_QUERY) && mode === "expressive";
  const mobile = useMediaQuery(FOOTER_MOBILE_QUERY);
  useFooterEntrance(footer, scene);
  useFooterMobileEntrance(footer, mobile && mode !== "static");
  // The headline, subtitle, call to action and bottom bar share one timed entrance on every screen.
  // The state outlasts the slowest part: the bottom bar starts at 850ms and runs for 800ms.
  useEntranceOnce(footer, true, "entrance", FOOTER_ENTRANCE_MS);

  return (
    <footer
      ref={footer}
      data-scene={scene || undefined}
      className={`${layout.footer} ${mobileCss.footer} ${entranceCss.footer} relative`}
    >
      <div className={`${layout.stage} relative overflow-hidden`}>
        <div aria-hidden className={`${layout.depth} pointer-events-none absolute inset-0`}>
          <SectionBackdrop
            poster="/media/footer.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/footer-640.webp 640w, /media/footer-960.webp 960w, /media/footer-1600.webp 1600w",
              aspectRatio: 16 / 9,
            }}
            scrim="bg-background/70 absolute inset-0"
          />
        </div>
        {/* Readability without hiding the skyline: dark at the top and bottom, open through the middle. */}
        <div
          aria-hidden
          className="from-background/80 via-background/10 to-background/90 pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b"
        />
        {/* Soft obsidian pool behind the columns only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[62%] bg-[radial-gradient(ellipse_70%_80%_at_50%_70%,rgb(8_12_13/0.72),transparent)]"
        />

        <div className="site-container relative z-10 pt-6 pb-24 sm:pb-8 lg:pt-8">
          <div className={layout.intro}>
            <FooterPart scene={scene} mobile={mobile} part="title" entrance>
              <p data-entrance-part="title" className={headingCss.title}>
                Thanks for <span className={headingCss.accent}>visiting</span>.
              </p>
            </FooterPart>

            <FooterPart scene={scene} mobile={mobile} part="subtitle" entrance>
              <p
                data-entrance-part="subtitle"
                className={`${subtitleCss.subtitle} mx-auto mt-2 max-w-[580px]`}
              >
                IT infrastructure, deployment automation, web and mobile development.
              </p>
              {sectionVisibility.contact !== false && (
                <SectionLink
                  data-entrance-part="cta"
                  crossPage={!!homeHrefPrefix}
                  scroll={!homeHrefPrefix}
                  href={`${homeHrefPrefix}#contact`}
                  onClick={(event) => glideToSection(event, "contact")}
                  className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-[14px] font-medium text-white backdrop-blur-md transition-colors duration-300 hover:border-(--brand-mid)/50 hover:bg-white/10 ${FOCUS}`}
                >
                  Let&apos;s build something
                  <ArrowRight className="text-brand-bright size-4" aria-hidden />
                </SectionLink>
              )}
            </FooterPart>
          </div>

          <div className={layout.columns}>
            <FooterPart
              scene={scene}
              mobile={mobile}
              part="logo"
              effect="zoom"
              duration={0.7}
              delay={0.3}
              className={`${layout.identity} ${layout.panel}`}
            >
              <div className="flex flex-col items-center text-center">
                <SectionLink
                  crossPage={!!homeHrefPrefix}
                  href={`${homeHrefPrefix}#hero`}
                  aria-label="Aristache, back to top"
                  className={`${layout.logo} inline-block rounded-lg ${FOCUS}`}
                >
                  <Image
                    src="/brand/logo-full-v2.webp"
                    alt=""
                    width={400}
                    height={415}
                    unoptimized
                    loading="lazy"
                    style={{ aspectRatio: "400 / 415" }}
                    className="h-[108px] w-auto sm:h-[124px]"
                  />
                </SectionLink>
                {heroTagline && (
                  <p className="mt-2 max-w-[290px] sm:mt-2.5">
                    <span
                      className={`${layout.tagline} border-border bg-background/40 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase backdrop-blur-sm`}
                    >
                      {heroTagline}
                    </span>
                  </p>
                )}
              </div>
            </FooterPart>

            <div className={`${layout.linksPanel} ${layout.panel}`}>
              <FooterPart
                scene={scene}
                mobile={mobile}
                part="explore"
                effect="cascade"
                duration={0}
                delay={0.3}
                staggerChildren={0.08}
              >
                <nav aria-label="Explore" className={layout.linkColumns}>
                  {[
                    {
                      title: "Explore",
                      links: visibleLinks.filter((link) => link.group === "explore"),
                    },
                    {
                      title: "Work",
                      links: visibleLinks.filter((link) => link.group === "work"),
                    },
                  ]
                    .filter(({ links }, index) => links.length > 0 || (index === 1 && supportLink))
                    .map(({ title, links }) => (
                      <div key={title} className="min-w-0">
                        <m.h3 initial={false} variants={itemVariants} className={HEADING}>
                          {title}
                        </m.h3>
                        <ul className={layout.linkList}>
                          {links.map((link) => (
                            <m.li key={link.href} initial={false} variants={itemVariants}>
                              <SectionLink
                                crossPage={!!homeHrefPrefix}
                                scroll={!homeHrefPrefix}
                                href={link.href}
                                onClick={(event) =>
                                  glideToSection(event, link.href.split("#")[1] ?? "")
                                }
                                className={COLUMN_LINK}
                              >
                                <span className={layout.label}>{link.label}</span>
                              </SectionLink>
                            </m.li>
                          ))}
                          {title === "Work" && supportLink && (
                            <m.li initial={false} variants={itemVariants}>
                              <SectionLink
                                crossPage={false}
                                href={supportLink.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={COLUMN_LINK}
                              >
                                <span className={layout.label}>{supportLink.label}</span>
                              </SectionLink>
                            </m.li>
                          )}
                        </ul>
                      </div>
                    ))}
                </nav>
              </FooterPart>

              <FooterPart
                scene={scene}
                mobile={mobile}
                part="legal"
                effect="cascade"
                duration={0}
                delay={0.3}
                staggerChildren={0.08}
                className={layout.resources}
              >
                <nav aria-label="Legal" className="w-full">
                  <m.h3 initial={false} variants={itemVariants} className={HEADING}>
                    Legal
                  </m.h3>
                  <ul className={layout.linkList}>
                    {legalLinks.map((link) => (
                      <m.li key={link.href} initial={false} variants={itemVariants}>
                        <Link
                          href={link.href}
                          {...(link.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className={COLUMN_LINK}
                        >
                          <span className={layout.label}>{link.label}</span>
                        </Link>
                      </m.li>
                    ))}
                    {process.env.NEXT_PUBLIC_GTAG_ID && (
                      <m.li initial={false} variants={itemVariants}>
                        <button
                          type="button"
                          onClick={(event) =>
                            window.dispatchEvent(
                              new CustomEvent(PREFERENCES_EVENT, {
                                detail: { opener: event.currentTarget },
                              }),
                            )
                          }
                          className={COLUMN_LINK}
                        >
                          <span className={layout.label}>Cookie settings</span>
                        </button>
                      </m.li>
                    )}
                  </ul>
                </nav>
              </FooterPart>
            </div>
          </div>

          <FooterPart
            scene={scene}
            mobile={mobile}
            part="bar"
            entrance
            entrancePart="bar"
            className={`${layout.legal} ${GLASS_CARD}`}
          >
            <m.div initial={false} variants={itemVariants} className="text-[13px] text-white/65">
              <span>
                Copyright &copy; <span className="text-brand-bright">{year}</span> {SITE.name}. All
                rights reserved.
              </span>
            </m.div>
            <m.p initial={false} variants={itemVariants} className={layout.credit}>
              DESIGNED &amp; BUILT WITH <span className="sr-only">CARE</span>
              {/* The cycling words are CSS-generated, so the page text reads "with care" once. */}
              <span aria-hidden className={wordsCss.words}>
                <span data-word="CARE" />
                <span data-word="PRECISION" />
                <span data-word="LOVE" />
                <span data-word="CARE" />
              </span>
            </m.p>
          </FooterPart>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
