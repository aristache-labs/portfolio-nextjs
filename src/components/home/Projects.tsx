import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import motionCss from "@/components/navbar/support-motion.module.css";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { SectionBackdrop } from "./SectionBackdrop";
import type { MergedProject } from "@/lib/projects";

const GITHUB_PROFILE = "https://github.com/aristache-labs";

/** Server shell: heading and CTA stay server-rendered, and ProjectsBrowser owns the
 *  parts that need selection state (categories, showcase, filter, grid, quick view). */
export function Projects({
  projects,
  sponsorUrl,
}: {
  projects: MergedProject[];
  sponsorUrl?: string | null;
}) {
  return (
    <Section
      id="projects"
      className="scroll-mt-[80px] pt-2 pb-6 md:scroll-mt-4 md:pt-28 md:pb-12"
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
      <Reveal className="[@media(orientation:portrait)_and_(max-width:767px)]:mb-10 [@media(orientation:portrait)_and_(max-width:767px)]:flex [@media(orientation:portrait)_and_(max-width:767px)]:flex-col">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between [@media(orientation:portrait)_and_(max-width:767px)]:contents">
          <SectionHeading
            number="04"
            eyebrow="Projects"
            title="Where Ideas Become Reality"
            accent="Reality"
            breakAfter="Where Ideas"
            className="mb-0 [@media(orientation:portrait)_and_(max-width:767px)]:mb-4"
          />
          {sponsorUrl?.trim() && (
            <a
              href={sponsorUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="group border-brand-mid/30 hover:border-brand-mid/65 hover:bg-brand-mid/10 focus-visible:ring-brand-mid/70 inline-flex min-h-11 shrink-0 items-center gap-2.5 self-start rounded-full border bg-(--bg) px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:outline-none md:mb-1 md:self-auto [@media(orientation:portrait)_and_(max-width:767px)]:order-2 [@media(orientation:portrait)_and_(max-width:767px)]:mt-4"
            >
              <Image
                src="/icons/heart.svg"
                alt=""
                width={16}
                height={16}
                className={`${motionCss.heart} size-4 shrink-0 object-contain`}
              />
              Support Independent Projects
              <ArrowUpRight
                className="size-4 text-white/65 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          )}
        </div>
        <p className="text-muted mb-10 max-w-2xl text-sm leading-relaxed text-pretty md:text-base [@media(orientation:portrait)_and_(max-width:767px)]:order-1 [@media(orientation:portrait)_and_(max-width:767px)]:mb-0">
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
