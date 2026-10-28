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
import { SkipLink } from "@/components/navbar/SkipLink";
import { SiteNav } from "@/components/navbar/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { SectionBackdrop } from "@/components/home/SectionBackdrop";
import { getNavigationProfile, getFundingLinks, getSocialLinks } from "@/lib/queries";
import styles from "./privacy.module.css";
import { SITE } from "@/lib/seo/site";
import { LEGAL } from "@/lib/legal";
import { LegalLink } from "@/components/legal/LegalLink";

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

export const revalidate = 43200;

export default async function PrivacyPage() {
  const [profile, funding, socials] = await Promise.all([
    getNavigationProfile(),
    getFundingLinks(),
    getSocialLinks(),
  ]);
  const contactEmail = profile.email?.trim() || LEGAL.contactEmail;
  const contactHref = `mailto:${contactEmail}`;
  const sections = [
    {
      id: "overview",
      label: "Operator and contact",
      icon: ShieldCheck,
      content: (
        <>
          This personal portfolio is operated by {SITE.name}, an individual based in {LEGAL.country}
          , who is the controller of personal data handled through this site. Privacy questions and
          requests can be sent directly to{" "}
          <a href={contactHref} className="text-brand-bright underline underline-offset-4">
            {contactEmail}
          </a>
          . You do not need an account to browse the portfolio or exercise your rights.
        </>
      ),
    },
    {
      id: "contact-information",
      label: "Contact messages",
      icon: Mail,
      content: (
        <>
          The contact form asks for your name, email address, subject and message so I can
          understand and answer your inquiry. Resend handles email delivery and message records. The
          form handler does not save submissions in the portfolio database or publish them on the
          site. Providing these details is voluntary, but I cannot handle a form inquiry without the
          required fields or reply by email without a usable address. Do not include passwords,
          identity documents or sensitive personal information. Messages are not used for
          newsletters or advertising.
        </>
      ),
    },
    {
      id: "legal-bases",
      label: "Purposes and legal bases",
      icon: ShieldCheck,
      content: (
        <>
          Ordinary correspondence is handled to pursue my legitimate interest in responding to
          people who contact me (Article 6(1)(f) GDPR). When you request specific steps towards a
          possible contract with you, the necessary processing instead relies on Article 6(1)(b).
          Operating and securing the portfolio and preventing abuse rely on legitimate interests
          under Article 6(1)(f), balanced against visitors&apos; rights. These interests do not
          authorise unrelated marketing. Submitting a message is not treated as blanket consent.
          Where consent is the applicable basis for any separate processing, it can be withdrawn
          without affecting earlier lawful processing.
        </>
      ),
    },
    {
      id: "hosting-security",
      label: "Hosting and security",
      icon: ShieldCheck,
      content: (
        <>
          Vercel hosts the site and serves its files, including uploads stored in Vercel Blob.
          Requests can expose IP addresses, browser information, requested URLs, timestamps and
          diagnostic or security information to the hosting infrastructure. The contact endpoint
          uses IP-based counters in server memory to limit repeated submissions; its counting window
          is one hour. Infrastructure logs are separate from those counters. Neon stores portfolio
          content and administrator account records. Contact messages are not written to Neon by the
          contact endpoint.
        </>
      ),
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: ChartNoAxesCombined,
      content: (
        <>
          Google Analytics 4 (GA4) measures visits, pages, referrers, approximate location, browsers
          and devices using cookies, only after you explicitly accept optional analytics. No Google
          tag or analytics request loads before acceptance. The legal basis is your consent under
          Article 6(1)(a) GDPR and Article 4(5) of Romanian Law 506/2004. Google Ireland Ltd.
          processes analytics data. Processing may involve transfers to the United States under the
          EU-US Data Privacy Framework. Google Signals and advertising personalization are disabled.
          Analytics records page views (page_view), scrolls (scroll), outbound link clicks (click)
          and file downloads (file_download). GA4 also generates visit, session and engagement
          events such as first_visit, session_start and user_engagement. Automatic form
          interactions, site search and video engagement measurement are disabled. I do not send
          contact-form fields as custom analytics events. Event-level analytics data is retained for
          14 months, as configured in the GA4 property. Aggregate reports have separate retention.
          You can withdraw consent anytime using Cookie settings in the footer. See{" "}
          <LegalLink href="https://policies.google.com/privacy">
            Google&apos;s privacy policy
          </LegalLink>
          .
        </>
      ),
    },
    {
      id: "cookies",
      label: "Cookies and local storage",
      icon: ShieldCheck,
      content: (
        <>
          The site does not use advertising cookies. Optional analytics cookies require consent.
          Cookie settings in the footer lets you accept or reject analytics at any time. Rejecting
          disables collection and deletes existing _ga cookies for this site. Browser controls can
          also remove stored data, but removing authentication cookies signs you out.
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="mb-2 text-left">
                Cookies and local storage used by this site
              </caption>
              <thead>
                <tr>
                  {["Name", "Purpose", "Basis", "Expiry"].map((label) => (
                    <th key={label} scope="col" className="border-brand-mid/20 border-b p-2">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "_ga",
                    "Analytics visitor identifier",
                    "Consent",
                    "2 years by default, renewed on visits",
                  ],
                  [
                    "_ga_<ID>",
                    "Analytics session state",
                    "Consent",
                    "2 years by default, renewed on visits",
                  ],
                  [
                    "analytics-consent-v2",
                    "Local storage remembering your choice",
                    "Strictly necessary",
                    "Until cleared in browser storage",
                  ],
                  [
                    "authjs.session-token (or __Secure-authjs.session-token)",
                    "Admin authentication",
                    "Strictly necessary",
                    "30 days of inactivity by default",
                  ],
                  [
                    "Auth.js sign-in security cookies",
                    "Admin sign-in checks",
                    "Strictly necessary",
                    "Short-lived or session-specific",
                  ],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={index} className="border-brand-mid/15 border-b p-2 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          Administrator sign-in uses Auth.js and GitHub. The administrator interface also saves its
          sidebar preference in local storage. Hosting security checks may use necessary mechanisms.
        </>
      ),
    },
    {
      id: "recipients",
      label: "Providers and external content",
      icon: ShieldCheck,
      content: (
        <>
          Service providers receive data needed for their roles: Vercel for hosting and files;
          Google Ireland Ltd. for consent-based analytics; Resend for email handling; Neon for the
          database; and GitHub for administrator authentication. Their terms describe their
          processing and subprocessors:{" "}
          <LegalLink href="https://vercel.com/legal/dpa">Vercel</LegalLink>,{" "}
          <LegalLink href="https://resend.com/legal/dpa">Resend</LegalLink>,{" "}
          <LegalLink href="https://business.safety.google/adsprocessorterms/">Google</LegalLink> and{" "}
          <LegalLink href="https://neon.com/platform-terms">Neon</LegalLink>. Project previews may
          request images from GitHub or badges from Shields.io, exposing network information such as
          your IP address to those services. Their notices are available at{" "}
          <LegalLink href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub
          </LegalLink>{" "}
          and <LegalLink href="https://shields.io/privacy">Shields.io</LegalLink>. Following
          external project, social or support links takes you to services with their own privacy
          practices. I do not sell personal data.
        </>
      ),
    },
    {
      id: "international-transfers",
      label: "International processing",
      icon: ShieldCheck,
      content: (
        <>
          The Vercel application functions are configured for Frankfurt, Germany. This does not
          confine every service, backup or network request to Germany or the European Economic Area
          (EEA): Vercel uses a global network, and Resend stores message content and delivery
          records in the United States. Resend&apos;s choice of sending region does not change that
          storage location. The providers&apos; data-processing terms describe their international
          transfer arrangements, including Standard Contractual Clauses where applicable. You can
          contact me for information about the safeguards relevant to your data and how to obtain a
          copy. See{" "}
          <LegalLink href="https://resend.com/security/gdpr">
            Resend&apos;s storage and transfer details
          </LegalLink>{" "}
          and{" "}
          <LegalLink href="https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en">
            the EDPB transfer guidance
          </LegalLink>
          .
        </>
      ),
    },
    {
      id: "retention",
      label: "How long data is kept",
      icon: ShieldCheck,
      content: (
        <>
          Resend currently documents 30-day retention for email and log data on its Free plan, with
          a separate seven-day backup period. This is a provider retention window, not an automatic
          deletion rule for every reply, forwarded message or exported copy. Separate correspondence
          is kept according to the need to resolve the inquiry and necessary follow-up, or to meet a
          specific legal obligation or handle a legal claim; it should be removed when those reasons
          no longer apply. The application has no automatic mailbox cleanup job. Hosting records,
          database backups and analytics reports have separate provider retention windows. Ask about
          a particular record or request erasure using the contact above. See{" "}
          <LegalLink href="https://resend.com/security/gdpr">
            Resend&apos;s retention details
          </LegalLink>
          .
        </>
      ),
    },
    {
      id: "your-rights",
      label: "Your rights and updates",
      icon: ShieldCheck,
      content: (
        <>
          The{" "}
          <Link href="/gdpr" className="text-brand-bright underline underline-offset-4">
            data rights page
          </Link>{" "}
          explains access, correction, erasure, restriction, portability, objection and how to
          complain to a supervisory authority. I do not use your data for solely automated decisions
          producing legal or similarly significant effects, or for advertising profiles. Spam
          controls can reject submissions but do not make those kinds of decisions about you. This
          notice may change when the site or its providers change; the review date below identifies
          this version.
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
              <p className="text-muted mt-3 text-xs">
                Last reviewed: <time dateTime={LEGAL.updatedAt}>{LEGAL.updatedLabel}</time>
              </p>
            </header>

            <div
              className={`${styles.content} mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16`}
            >
              <nav
                aria-label="Privacy page contents"
                className={`${styles.contentsNav} lg:sticky lg:top-8 lg:self-start`}
              >
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
                {sections.map(({ id, label, icon: Icon, content }) => (
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
                    <div className="text-muted mt-4 text-base leading-7">{content}</div>
                  </section>
                ))}
                <div className="border-brand-mid/20 bg-brand-mid/5 mt-4 rounded-2xl border p-5 sm:p-6">
                  <h2 className="text-lg font-medium">Questions about privacy?</h2>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    Contact me directly about this notice or your personal data.
                  </p>
                  <a
                    href={contactHref}
                    className="text-brand-bright focus-visible:ring-brand-mid mt-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {contactEmail} <ArrowUpRight aria-hidden className="size-4" />
                  </a>
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
