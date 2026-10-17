import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Privacy | ${SITE.name}`,
  description: `How ${SITE.name} handles information submitted through this site.`,
};

export default function PrivacyPage() {
  return (
    <article className="site-container text-foreground py-24 md:py-32">
      <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">Privacy</p>
      <h1 className="font-display mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
        Privacy
      </h1>
      <div className="text-muted mt-8 max-w-2xl space-y-4 text-base leading-relaxed">
        <p>This site is the portfolio of {SITE.name}. It does not sell personal information.</p>
        <p>
          The contact form collects your name, email, subject, and message so I can reply. Those
          details are sent to me by email and are not added to a public page.
        </p>
        <p>
          The site uses Vercel Analytics and Speed Insights. Google Analytics loads only when it is
          configured. These tools record aggregate visits, not the contents of the contact form.
        </p>
        <p>
          Questions about this page can go through the{" "}
          <Link href="/#contact" className="text-foreground underline-offset-4 hover:underline">
            contact section
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
