import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="site-container text-foreground flex min-h-dvh flex-col py-6 sm:py-8">
      <header>
        <Link
          href="/"
          aria-label="Aristache, back to portfolio"
          className="focus-visible:ring-brand-mid inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo />
          <span className="font-mono text-xs tracking-[0.2em] uppercase">Aristache</span>
        </Link>
      </header>

      <section
        aria-labelledby="not-found-title"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 sm:py-16"
      >
        <p className="text-brand-bright font-mono text-sm tracking-[0.2em]">404</p>
        <h1
          id="not-found-title"
          className="font-display mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] font-extrabold tracking-tight text-balance"
        >
          This page took a <span className="gradient-text">different path.</span>
        </h1>
        <p className="text-muted mt-5 max-w-md text-base leading-relaxed">
          The page you are looking for could not be found. Head back to the portfolio to explore my
          work or get in touch.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="border-brand-mid/40 bg-brand-deep/30 text-brand-bright hover:bg-brand-deep/45 focus-visible:ring-brand-mid inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowLeft aria-hidden className="size-4" /> Back to portfolio
          </Link>
          <Link
            href="/#contact"
            className="text-muted hover:text-brand-bright focus-visible:ring-brand-mid inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-3 text-[14px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Get in touch <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
