import { ArrowRight, ArrowUpRight, Monitor, Server, Smartphone, Terminal } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ProjectsBrowser } from "./ProjectsBrowser";
import type { MergedProject } from "@/lib/projects";

const GITHUB_PROFILE = "https://github.com/aristache-labs";

const CATEGORIES: {
  number: string;
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    number: "01",
    title: "Web Applications",
    body: "Modern, scalable web apps with great user experiences.",
    icon: Monitor,
  },
  {
    number: "02",
    title: "Mobile Solutions",
    body: "Cross-platform mobile apps with performance in mind.",
    icon: Smartphone,
  },
  {
    number: "03",
    title: "Systems & Infrastructure",
    body: "Reliable systems, clean architecture, and automation.",
    icon: Server,
  },
  {
    number: "04",
    title: "Automation & Tools",
    body: "Custom tools and workflows that save time and scale.",
    icon: Terminal,
  },
];

/** Server shell: heading and CTA stay server-rendered, and ProjectsBrowser owns the
 *  parts that need selection state (showcase, filter, grid, quick view). */
export function Projects({ projects }: { projects: MergedProject[] }) {
  return (
    <Section id="projects" className="scroll-mt-24">
      <Reveal>
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading number="05" eyebrow="Projects" title="Featured work" className="mb-0" />
          <a
            href="#project-list"
            className="text-muted hover:text-foreground mb-1 hidden shrink-0 items-center gap-1 font-mono text-xs tracking-[0.16em] uppercase sm:inline-flex"
          >
            View all projects <ArrowRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </Reveal>

      <div className="mb-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <a
              key={category.number}
              href="#project-list"
              className="border-border bg-surface group flex h-full flex-col rounded-2xl border p-5 transition-colors hover:border-(--brand-mid)/40"
            >
              <span className="text-muted font-mono text-xs tracking-[0.16em]">
                {category.number}
              </span>
              <span className="mt-6 grid size-12 place-items-center rounded-xl bg-[rgb(var(--brand-mid-rgb)/0.08)]">
                <Icon className="size-6 text-(--brand-mid)" aria-hidden />
              </span>
              <span className="mt-6 text-lg font-semibold tracking-tight">{category.title}</span>
              <span className="text-muted mt-2 flex-1 text-sm leading-relaxed">
                {category.body}
              </span>
              <ArrowRight
                className="mt-4 size-4 text-(--brand-mid) transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          );
        })}
      </div>

      <div id="project-list" className="scroll-mt-24">
        <ProjectsBrowser projects={projects} />
      </div>

      <div className="mt-12 text-center">
        <Magnetic>
          <Button
            href={GITHUB_PROFILE}
            variant="secondary"
            size="md"
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<ArrowUpRight className="size-4" aria-hidden />}
          >
            View all on GitHub
          </Button>
        </Magnetic>
      </div>
    </Section>
  );
}

export default Projects;
