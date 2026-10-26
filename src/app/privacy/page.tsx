import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  Mail,
  ChartNoAxesCombined,
  ChevronDown,
} from "lucide-react";
import { SiteNav } from "@/components/navbar/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import { getNavigationProfile, getFundingLinks, getSocialLinks } from "@/lib/queries";
import styles from "./privacy.module.css";
import { SITE } from "@/lib/seo/site";

const privacyDescription = `How ${SITE.name} handles information submitted through this site.`;

export const metadata: Metadata = {
  title: "Privacy",
  description: privacyDescription,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    url: new URL("/privacy", SITE.url).toString(),
    siteName: SITE.name,
    title: `Privacy | ${SITE.name}`,
    description: privacyDescription,
    locale: "en_US",
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy | ${SITE.name}`,
    description: privacyDescription,
    images: ["/opengraph-image"],
  },
};

const sections = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "contact-information", label: "Contact information", icon: Mail },
  { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
];

export const revalidate = 43200;

export default async function PrivacyPage() {
  const [profile, funding, socials] = await Promise.all([
    getNavigationProfile(),
    getFundingLinks(),
    getSocialLinks(),
  ]);
  return (
    <>
      <SiteNav
        socials={[]}
        hidden={Object.entries(profile.sectionVisibility)
          .filter(([, visible]) => visible === false)
          .map(([id]) => id)}
      />
      <div className={styles.backdropSection}>
        <SectionBackdrop
          video="/media/services.mp4"
          poster="/media/services.webp"
          scrim="absolute inset-0 bg-background/80"
        />
        <div className="site-container text-foreground relative z-10 min-h-dvh pb-16 sm:pb-24">
          <div className="h-24" aria-hidden />
          <article className={`${styles.article} mx-auto max-w-5xl pt-12 sm:pt-20`}>
            <div className="mb-5 flex justify-start">
              <Link
                href="/"
                className={`${styles.backLink} text-muted hover:text-brand-bright inline-flex min-h-11 items-center gap-2 text-sm`}
              >
                <ArrowLeft aria-hidden className="size-4" />
                Back to portfolio
              </Link>
            </div>

            <header className="text-center">
              <span className="border-brand-mid/30 bg-brand-mid/10 text-brand-bright inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[13px] font-medium">
                <ShieldCheck aria-hidden className="size-3.5" /> Privacy policy
              </span>
              <h1 className="font-display mx-auto mt-3 max-w-4xl text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
                Your privacy<span className="gradient-text"> matters</span>
              </h1>
              <p className="text-foreground/70 mx-auto mt-2 max-w-2xl text-sm leading-relaxed sm:text-base">
                How information is handled when you visit this portfolio or get in touch.
              </p>
            </header>

            <div
              className={`${styles.content} mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16`}
            >
              <nav aria-label="Privacy page contents" className="lg:sticky lg:top-8 lg:self-start">
                <div className={styles.contentsDesktop}>
                  <p className="text-muted mb-4 text-sm">On this page</p>
                  <ul className="border-brand-mid/20 grid gap-1 border-l pl-3">
                    {sections.map(({ id, label }) => (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          className="text-muted hover:text-brand-bright focus-visible:ring-brand-mid inline-flex min-h-11 items-center rounded-md px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <details
                  className={`${styles.contentsMobile} group border-brand-mid/20 bg-background/60 rounded-xl border`}
                >
                  <summary className="text-foreground focus-visible:ring-brand-mid flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    On this page
                    <ChevronDown
                      aria-hidden
                      className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <div className="px-4 pb-3">
                    {" "}
                    <ul className="border-brand-mid/20 grid gap-1 border-l pl-3">
                      {sections.map(({ id, label }) => (
                        <li key={id}>
                          <a
                            href={`#${id}`}
                            className="text-muted hover:text-brand-bright focus-visible:ring-brand-mid inline-flex min-h-11 items-center rounded-md px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </nav>

              <div>
                {sections.map(({ id, label, icon: Icon }) => (
                  <section
                    key={id}
                    id={id}
                    aria-labelledby={`${id}-title`}
                    className="border-brand-mid/15 scroll-mt-[88px] border-t py-7 first:border-t-0 first:pt-0 sm:py-8"
                  >
                    <h2
                      id={`${id}-title`}
                      className="flex items-center gap-3 text-lg font-medium tracking-tight sm:text-xl"
                    >
                      <Icon
                        aria-hidden
                        className="text-brand-bright size-5 shrink-0"
                        strokeWidth={1.5}
                      />
                      {label}
                    </h2>
                    <p className="text-muted mt-4 text-base leading-7">
                      {id === "overview" && (
                        <>
                          This site is the portfolio of {SITE.name}. It does not sell personal
                          information.
                        </>
                      )}
                      {id === "contact-information" && (
                        <>
                          The contact form collects your name, email, subject, and message so I can
                          reply. Those details are sent to me by email and are not added to a public
                          page.
                        </>
                      )}
                      {id === "analytics" && (
                        <>
                          The site uses Vercel Web Analytics to measure page views and navigation.
                          Google Analytics, Statsig and session replay are not enabled. Contact form
                          messages are used only to reply to your inquiry.
                        </>
                      )}
                    </p>
                  </section>
                ))}
                <div className="border-brand-mid/20 bg-brand-mid/5 mt-4 rounded-2xl border p-5 sm:p-6">
                  <h2 className="text-lg font-medium">Questions about privacy?</h2>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    Questions about this page can go through the contact section.
                  </p>
                  <Link
                    href="/#contact"
                    className="text-brand-bright focus-visible:ring-brand-mid mt-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                  >
                    Contact section <ArrowUpRight aria-hidden className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
      <Footer
        socials={socials}
        email={profile.email}
        heroTagline={profile.heroTagline}
        sectionVisibility={profile.sectionVisibility}
        sponsorUrl={funding.find((item) => item.primary)?.url}
        homeHrefPrefix="/"
      />
    </>
  );
}
