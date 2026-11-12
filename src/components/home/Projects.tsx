import { ArrowUpRight } from "lucide-react";
import { ProjectsArrival } from "./ProjectsArrival";
import motionCss from "./project-motion.module.css";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section } from "@/components/ui/Section";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { ProjectCoverGate } from "./ProjectCoverGate";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { SectionBackdrop } from "./SectionBackdrop";
import subtitleCss from "./section-subtitle.module.css";
import headingCss from "./section-heading.module.css";
import type { MergedProject } from "@/lib/projects";
import spacing from "./experience-projects-spacing.module.css";
import layoutCss from "./projects-layout.module.css";

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
  // The heading lives inside the browser so the Building now card can sit beside it.
  const header = (
    <ProjectsArrival kind="heading" effect="slide" className={layoutCss.sectionHeading}>
      <div
        className={`${layoutCss.headingRow} mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between`}
      >
        {/* Same scale and weight as the About, Skills and Experience headings. */}
        <div className={layoutCss.headingText}>
          <SectionLabel number={number} name="Projects" className={headingCss.label} />
          <h2 className={headingCss.title}>
            Selected <span className={headingCss.accent}>Projects</span>
          </h2>
        </div>
      </div>
      <p
        className={`${layoutCss.headingDescription} ${subtitleCss.subtitle} mb-10 max-w-2xl text-pretty lg:mb-6`}
      >
        Web and mobile applications, infrastructure projects and automation tools.
      </p>
    </ProjectsArrival>
  );

  return (
    <Section
      id="projects"
      // overflow-clip, not hidden: hidden makes the section a scroll container, which stops the
      // featured cards from sticking to the page.
      className={`${layoutCss.section} ${spacing.projects} ${motionCss.section} scroll-mt-[80px] overflow-clip pt-2 pb-6 md:scroll-mt-4 md:pt-28 md:pb-12 lg:pt-16`}
      backdrop={
        <>
          <SectionBackdrop
            frame="desktop-screen"
            video="/media/projects-v3.mp4"
            poster="/media/projects.webp"
            fetchPriority="low"
            deferUntilHeroLoaded
            deferUntilNearViewport
            responsivePoster={{
              srcSet:
                "/media/projects-640.webp 640w, /media/projects-960.webp 960w, /media/projects-1600.webp 1600w",
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
      <div id="project-list" className="scroll-mt-24">
        <ProjectCoverGate>
          <ProjectsBrowser projects={projects} header={header} />
        </ProjectCoverGate>
      </div>

      <ProjectsArrival kind="action" effect="fade" className="mt-12 text-center">
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
      </ProjectsArrival>
    </Section>
  );
}

export default Projects;
