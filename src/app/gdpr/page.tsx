import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronDown, ShieldCheck } from "lucide-react";
import { SkipLink } from "@/components/navbar/SkipLink";
import { SiteNav } from "@/components/navbar/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import { getNavigationProfile, getFundingLinks, getSocialLinks } from "@/lib/queries";
import { SITE } from "@/lib/seo/site";
import { LEGAL } from "@/lib/legal";
import { LegalLink } from "@/components/legal/LegalLink";
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
  const contactEmail = profile.email?.trim() || LEGAL.contactEmail;
  const contactHref = `mailto:${contactEmail}`;
  const sections = [
    {
      id: "about-your-data",
      title: "About your data",
      content: (
        <>
          {SITE.name}, an individual based in {LEGAL.country}, is the controller for this portfolio.
          Send privacy requests to{" "}
          <a href={contactHref} className="text-brand-bright underline underline-offset-4">
            {contactEmail}
          </a>
          . The{" "}
          <Link href="/privacy" className="text-brand-bright underline underline-offset-4">
            Privacy policy
          </Link>{" "}
          describes the data handled, its purposes and legal bases, providers, international
          processing and retention. There is no need to sign in or create an account to make a
          request.
        </>
      ),
    },
    {
      id: "your-rights",
      title: "Your rights",
      content: (
        <>
          You can ask what personal data I hold, obtain a copy, and correct inaccurate information.
          You can request erasure or restriction where the GDPR conditions apply. Portability
          applies to data you provided where processing is automated and based on consent or a
          contract. You may withdraw consent at any time without affecting the lawfulness of
          processing before withdrawal. Use Cookie settings in the footer to withdraw analytics
          consent. These rights have legal conditions and exceptions; if I cannot fulfil a request,
          I will explain why.{" "}
          <LegalLink href="https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en">
            The European Commission explains these rights
          </LegalLink>
          .
        </>
      ),
    },
    {
      id: "make-a-request",
      title: "Make a request",
      content: (
        <>
          Where possible, email me from the address you used to contact the site, explain which
          right you want to exercise, and give enough context to locate the relevant message or
          record. Include only what is needed; do not send identity documents with your initial
          request. If there are reasonable doubts about identity, I may ask for proportionate
          additional information before disclosing personal data. Requests are normally free. A
          reasonable fee or refusal is possible only for manifestly unfounded or excessive requests,
          with reasons explained.
        </>
      ),
    },
    {
      id: "objection-and-consent",
      title: "Objection and withdrawal",
      content: (
        <>
          Where processing relies on legitimate interests, you may object for reasons relating to
          your particular situation. I must stop unless the GDPR permits continued processing, for
          example because compelling legitimate grounds or legal claims justify it. If separate
          processing relies on consent, you can withdraw that consent using the same email address;
          withdrawal does not undo earlier lawful processing. Sending a contact message does not
          itself create a marketing subscription or blanket consent.
        </>
      ),
    },
    {
      id: "response-time",
      title: "When I will respond",
      content: (
        <>
          I will respond without undue delay and normally within one month of receiving your
          request. Where its complexity or the number of requests justifies an extension, the GDPR
          allows up to two further months; I will tell you within the first month and explain the
          delay. If I cannot act on a request, I will explain the reasons and the available
          complaint or judicial remedies.{" "}
          <LegalLink href="https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en">
            EDPB guidance explains the response rules
          </LegalLink>
          .
        </>
      ),
    },
    {
      id: "raise-a-concern",
      title: "Raise a concern",
      content: (
        <>
          You can complain to a data protection authority, particularly in the EU country where you
          live, work or where an alleged infringement happened. In Romania, this is the National
          Supervisory Authority for Personal Data Processing (ANSPDCP). Its{" "}
          <LegalLink href="https://www.dataprotection.ro/?page=Plangeri_pagina_principala">
            official complaints page
          </LegalLink>{" "}
          explains how to submit a complaint. You can also seek a judicial remedy where the GDPR
          provides one. Contacting me can help resolve an issue but does not remove your right to
          complain.
        </>
      ),
    },
  ];

  return (
    <>
      <SkipLink />
      <SiteNav
        socials={[]}
        hidden={Object.entries(profile.sectionVisibility)
          .filter(([, visible]) => visible === false)
          .map(([id]) => id)}
      />
      <div id="page-content" tabIndex={-1} className="scroll-mt-24 outline-none" />
      <div className={styles.backdropSection}>
        <SectionBackdrop
          video="/media/about-v3.mp4"
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
              <p className="text-muted mt-3 text-xs">
                Last reviewed: <time dateTime={LEGAL.updatedAt}>{LEGAL.updatedLabel}</time>
              </p>
            </header>
            <div
              className={`${styles.content} mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16`}
            >
              <nav
                aria-label="GDPR page contents"
                className={`${styles.contentsNav} lg:sticky lg:top-8 lg:self-start`}
              >
                <div className={styles.contentsDesktop}>
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
                  </div>
                </details>
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
                  Contact about your data: {contactEmail}{" "}
                  <ArrowUpRight aria-hidden className="size-4" />
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
