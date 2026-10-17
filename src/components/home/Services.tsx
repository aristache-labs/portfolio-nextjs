import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ServiceCard } from "./ServiceCard";
import { SectionBackdrop } from "./SectionBackdrop";
import type { Service } from "@/db/schema";

export type ServiceRow = Service;

export function Services({ services }: { services: ServiceRow[] }) {
  const sorted = [...services].sort((a, b) => a.order - b.order);

  return (
    <Section
      id="services"
      className="scroll-mt-24 pt-6 pb-4 md:pt-12 md:pb-6"
      backdrop={
        <>
          <SectionBackdrop video="/media/about.mp4" poster="/media/about.webp" />
          <div
            aria-hidden
            className="bg-background/70 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <Reveal>
        <SectionHeading
          number="05"
          eyebrow="Services"
          title="What I do"
          accent="do"
          className="mb-4"
        />
        <p className="text-muted mb-10 max-w-2xl text-sm leading-relaxed text-pretty md:text-base">
          From enterprise infrastructure to modern applications - delivering reliable solutions
          through engineering, automation, and innovation.
        </p>
      </Reveal>

      {sorted.length === 0 ? (
        <Card className="flex items-center justify-center py-12 text-center">
          <p className="text-muted text-sm">No services listed yet.</p>
        </Card>
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {sorted.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.05} className="h-full">
              <ServiceCard service={s} index={i} />
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}

export default Services;
