import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/navbar/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import { getNavigationProfile, getFundingLinks, getSocialLinks } from "@/lib/queries";
import { SITE } from "@/lib/seo/site";
import styles from "../privacy/privacy.module.css";

const description = "Your personal data rights and how to make a request about this portfolio.";

export const metadata: Metadata = {
  title: "GDPR",
  description,
  alternates: { canonical: "/gdpr" },
  openGraph: {
    type: "website",
    url: new URL("/gdpr", SITE.url).toString(),
    siteName: SITE.name,
    title: `GDPR | ${SITE.name}`,
    description,
    locale: "en_US",
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `GDPR | ${SITE.name}`,
    description,
    images: ["/opengraph-image"],
  },
};

export const revalidate = 43200;

export default async function GdprPage() {
  const [profile, funding, socials] = await Promise.all([
    getNavigationProfile(),
    getFundingLinks(),
    getSocialLinks(),
  ]);
  const contactHref = profile.email ? `mailto:${profile.email}` : "/#contact";
  const sections = [
    {
      id: "about-your-data",
      title: "About your data",
      content: (
        <>
          This portfolio is operated by {SITE.name}. The{" "}
          <Link href="/privacy" className="text-brand-bright underline underline-offset-4">
            Privacy policy
          </Link>{" "}
          explains how the contact form and site analytics handle information. This page explains
          how to raise a request under the General Data Protection Regulation (GDPR).
        </>
      ),
    },
    {
      id: "your-rights",
      title: "Your rights",
      content: (
        <>
          Depending on the circumstances, you can request access to your personal data, correction
          of inaccurate information, deletion, restriction of processing, or a portable copy. You
          can object to processing where the GDPR provides that right. Where processing relies on
          consent, you can withdraw it without affecting earlier lawful processing. These rights are
          subject to the conditions and exceptions in the GDPR.
        </>
      ),
    },
    {
      id: "make-a-request",
      title: "Make a request",
      content: (
        <>
          Contact me using the link below. Describe your request and the email address you used when
          contacting this site. Please avoid sending identity documents or other sensitive
          information with your initial message. Identity verification may be needed before data is
          disclosed. Under the GDPR, requests generally require a response within one month; complex
          or numerous requests may allow an extension of up to two further months, with notice
          during the first month.
        </>
      ),
    },
    {
      id: "raise-a-concern",
      title: "Raise a concern",
      content: (
        <>
          You can lodge a complaint with a data protection supervisory authority, particularly in
          the EU country where you live, work, or where an alleged infringement occurred. More
          information about your rights is available from the{" "}
          <a
            href="https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-bright underline underline-offset-4"
          >
            European Commission
          </a>
          .
        </>
      ),
    },
  ];

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
            <Link
              href="/"
              className={`${styles.backLink} text-muted hover:text-brand-bright mb-5 inline-flex min-h-11 items-center gap-2 text-sm`}
            >
              <ArrowLeft aria-hidden className="size-4" /> Back to portfolio
            </Link>
            <header className="text-center">
              <span className="border-brand-mid/30 bg-brand-mid/10 text-brand-bright inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[13px] font-medium">
                <ShieldCheck aria-hidden className="size-3.5" /> GDPR
              </span>
              <h1 className="font-display mx-auto mt-3 max-w-4xl text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
                Your data<span className="gradient-text"> rights</span>
              </h1>
              <p className="text-foreground/70 mx-auto mt-2 max-w-2xl text-sm leading-relaxed sm:text-base">
                How to ask about, access, or correct your personal information.
              </p>
            </header>
            <div
              className={`${styles.content} mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16`}
            >
              <nav aria-label="GDPR page contents" className="lg:sticky lg:top-8 lg:self-start">
                <p className="text-muted mb-4 text-sm">On this page</p>
                <ul className="border-brand-mid/20 grid gap-1 border-l pl-3">
                  {sections.map(({ id, title }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="text-muted hover:text-brand-bright focus-visible:ring-brand-mid inline-flex min-h-11 items-center rounded-md px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div>
                {sections.map(({ id, title, content }) => (
                  <section
                    key={id}
                    id={id}
                    aria-labelledby={`${id}-title`}
                    className="border-brand-mid/15 scroll-mt-[88px] border-t py-7 first:border-t-0 first:pt-0 sm:py-8"
                  >
                    <h2
                      id={`${id}-title`}
                      className="text-lg font-medium tracking-tight sm:text-xl"
                    >
                      {title}
                    </h2>
                    <p className="text-muted mt-4 text-base leading-7">{content}</p>
                  </section>
                ))}
                <a
                  href={contactHref}
                  className="text-brand-bright focus-visible:ring-brand-mid mt-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                >
                  Contact about your data <ArrowUpRight aria-hidden className="size-4" />
                </a>
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
