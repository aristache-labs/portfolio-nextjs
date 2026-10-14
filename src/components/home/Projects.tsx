import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ProjectsBrowser } from "./ProjectsBrowser";
import type { MergedProject } from "@/lib/projects";

const GITHUB_PROFILE = "https://github.com/aristache-labs";

/** Server shell: heading and CTA stay server-rendered, and ProjectsBrowser owns the
 *  parts that need selection state (categories, showcase, filter, grid, quick view). */
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
