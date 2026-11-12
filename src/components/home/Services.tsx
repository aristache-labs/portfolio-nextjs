"use client";

import { ProgressiveReveal } from "@/components/motion/ProgressiveReveal";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ServiceCard } from "./ServiceCard";
import { SectionBackdrop } from "./SectionBackdrop";
import labelCss from "@/components/ui/section-label.module.css";
import headingCss from "./section-heading.module.css";
import layoutCss from "./services-layout.module.css";
import type { Service } from "@/db/schema";

export type ServiceRow = Service;

export function Services({ services, number = "05" }: { services: ServiceRow[]; number?: string }) {
  const sorted = [...services].sort((a, b) => a.order - b.order || a.id - b.id).slice(0, 4);

  return (
    <Section
      id="services"
      className={`${layoutCss.section} scroll-mt-[80px] pt-6 pb-4 md:pt-12 md:pb-6`}
      backdrop={
        <>
          <SectionBackdrop
            video="/media/about-v3.mp4"
            poster="/media/about-frame.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/about-frame-640.webp 640w, /media/about-frame-960.webp 960w, /media/about-frame.webp 1600w",
              aspectRatio: 16 / 9,
              portrait: {
                srcSet: "/media/about-frame-640.webp 640w, /media/about-frame-960.webp 960w",
                maxWidth: 960,
              },
            }}
          />
          <div
            aria-hidden
            className={`${layoutCss.scrim} bg-background/70 md:bg-background/80 pointer-events-none absolute inset-0 z-[1]`}
          />
        </>
      }
    >
      <div className="mb-5">
        <ProgressiveReveal duration={0.6} delay={0}>
          <p className={`${labelCss.label} ${headingCss.label}`}>
            <span className={labelCss.number}>{number}</span>
            <span>Services</span>
            <span aria-hidden className={labelCss.rule} />
          </p>
        </ProgressiveReveal>
        <ProgressiveReveal duration={0.8} delay={0.1}>
          <h2 className={headingCss.title}>
            What I <span className={headingCss.accent}>do</span>
          </h2>
        </ProgressiveReveal>
      </div>
      {sorted.length === 0 ? (
        <ProgressiveReveal duration={0.55} delay={0}>
          <Card className="flex items-center justify-center py-12 text-center">
            <p className="text-muted text-sm">No services listed yet.</p>
          </Card>
        </ProgressiveReveal>
      ) : (
        <div
          className={`${layoutCss.grid} grid items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-4`}
        >
          {sorted.map((s, i) => (
            <ProgressiveReveal
              key={s.id}
              duration={0.55}
              delay={Math.min(i * 0.08, 0.4)}
              className="h-full"
            >
              <ServiceCard service={s} />
            </ProgressiveReveal>
          ))}
        </div>
      )}
    </Section>
  );
}

export default Services;
