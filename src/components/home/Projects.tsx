import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { SectionBackdrop } from "./SectionBackdrop";
import subtitleCss from "./section-subtitle.module.css";
import type { MergedProject } from "@/lib/projects";
import spacing from "./experience-projects-spacing.module.css";

const GITHUB_PROFILE = "https://github.com/aristache-labs";

/** Server shell: heading and CTA stay server-rendered, and ProjectsBrowser owns the
 *  parts that need selection state (categories, showcase, filter, grid, quick view). */
export function Projects({
  projects,
  number = "04",
}: {
  projects: MergedProject[];
  number?: string;
}) {
  return (
    <Section
      id="projects"
      className={`${spacing.projects} scroll-mt-[80px] pt-2 pb-6 md:scroll-mt-4 md:pt-28 md:pb-12`}
      backdrop={
        <>
          <SectionBackdrop
            frame="desktop-screen"
            video="/media/projects.mp4"
            poster="/media/projects.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/projects-640.webp 640w, /media/projects-960.webp 960w, /media/projects.webp 1600w",
              aspectRatio: 16 / 9,
            }}
          />
          <div
            aria-hidden
            className="bg-background/70 pointer-events-none absolute inset-0 z-[1]"
          />
        </>
      }
    >
      <Reveal className="[@media(orientation:portrait)_and_(max-width:767px)]:mb-10 [@media(orientation:portrait)_and_(max-width:767px)]:flex [@media(orientation:portrait)_and_(max-width:767px)]:flex-col">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between [@media(orientation:portrait)_and_(max-width:767px)]:contents">
          <SectionHeading
            number={number}
            eyebrow="Projects"
            title="Selected Projects"
            accent="Projects"
            className="mb-0 [@media(orientation:portrait)_and_(max-width:767px)]:mb-4"
          />
        </div>
        <p
          className={`${subtitleCss.subtitle} mb-10 max-w-2xl text-pretty [@media(orientation:portrait)_and_(max-width:767px)]:order-1 [@media(orientation:portrait)_and_(max-width:767px)]:mb-0`}
        >
          Web and mobile applications, infrastructure projects and automation tools.
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
