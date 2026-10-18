import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { SectionBackdrop } from "./SectionBackdrop";
import type { MergedProject } from "@/lib/projects";

const GITHUB_PROFILE = "https://github.com/aristache-labs";

/** Server shell: heading and CTA stay server-rendered, and ProjectsBrowser owns the
 *  parts that need selection state (categories, showcase, filter, grid, quick view). */
export function Projects({ projects }: { projects: MergedProject[] }) {
  return (
    <Section
      id="projects"
      className="scroll-mt-18 pt-2 pb-6 md:scroll-mt-4 md:pt-28 md:pb-12"
      backdrop={
        <>
          <SectionBackdrop video="/media/projects.mp4" poster="/media/projects.webp" />
          <div
            aria-hidden
            className="bg-background/70 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <Reveal>
        <SectionHeading
          number="04"
          eyebrow="Projects"
          title="Where Ideas Become Reality"
          accent="Reality"
          breakAfter="Where Ideas"
          className="mb-4"
        />
        <p className="text-muted mb-10 max-w-2xl text-sm leading-relaxed text-pretty md:text-base">
          A collection of projects built through creativity, engineering, and purpose.
        </p>
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
