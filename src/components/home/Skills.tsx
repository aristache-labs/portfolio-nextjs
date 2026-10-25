"use client";

import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { useReducedMotionProps } from "@/hooks/useReducedMotion";
import { Quote, Zap } from "lucide-react";
import { SkillCard, skillPercent } from "./SkillCard";
import { SectionBackdrop } from "./SectionBackdrop";
import responsiveCss from "./skills-responsive.module.css";
import labelCss from "@/components/ui/section-label.module.css";
import subtitleCss from "./section-subtitle.module.css";

export type SkillRow = {
  name: string;
  iconPath: string;
  category: string;
  order: number;
  level?: string | null;
};

const MOST_USED = "Most Used";
/** Homepage filter order. Tabs still appear only when a skill uses that category. */
const CATEGORY_ORDER = ["Development", "Infrastructure", "Automation", "Data & Cloud"];
/** Default tab keeps the grid to one screen. A category pill reveals that group. */
const MOST_USED_LIMIT = 8;

function byOrder(skills: SkillRow[]) {
  return [...skills].sort((a, b) => a.order - b.order);
}

/** Highest levels first; admin order breaks ties. Missing levels follow rated skills. */
function mostUsedSkills(skills: SkillRow[]) {
  return [...skills]
    .sort(
      (a, b) => (skillPercent(b.level) ?? -1) - (skillPercent(a.level) ?? -1) || a.order - b.order,
    )
    .slice(0, MOST_USED_LIMIT);
}

export function Skills({ skills, number = "02" }: { skills: SkillRow[]; number?: string }) {
  const reducedMotionProps = useReducedMotionProps();
  const ordered = useMemo(() => byOrder(skills), [skills]);
  const categories = useMemo(() => {
    const present = new Set(ordered.map((skill) => skill.category));
    const known = CATEGORY_ORDER.filter((category) => present.has(category));
    const extras: string[] = [];
    for (const skill of ordered) {
      if (CATEGORY_ORDER.includes(skill.category) || extras.includes(skill.category)) continue;
      extras.push(skill.category);
    }
    return [...known, ...extras];
  }, [ordered]);

  const [filter, setFilter] = useState(MOST_USED);
  const active = filter !== MOST_USED && categories.includes(filter) ? filter : MOST_USED;
  const visible =
    active === MOST_USED ? mostUsedSkills(ordered) : ordered.filter((s) => s.category === active);

  return (
    <section
      id="skills"
      className={`${responsiveCss.section} relative z-10 scroll-mt-[80px] overflow-x-clip overflow-y-visible`}
    >
      <div className={responsiveCss.backdrop}>
        <SectionBackdrop
          frame="screen"
          focus="left"
          video="/media/skills.mp4"
          poster="/media/skills.webp"
          fetchPriority="low"
          deferUntilHeroLoaded
          deferUntilNearViewport
          responsivePoster={{
            srcSet:
              "/media/skills-640.webp 640w, /media/skills-960.webp 960w, /media/skills-1280.webp 1280w, /media/skills.webp 1536w",
            aspectRatio: 3 / 2,
          }}
        />
      </div>
      <div
        className={`${responsiveCss.content} relative z-10 mx-auto flex max-w-7xl flex-col px-5 pt-6 pb-10 sm:px-8 md:pt-8 lg:block`}
      >
        <div className="lg:grid lg:grid-cols-[0.8fr_1.6fr] lg:gap-6">
          <div aria-hidden className="hidden lg:block" />
          <div className={`${responsiveCss.heading} min-w-0 text-left`}>
            <div className={`${labelCss.label} ${responsiveCss.sectionLabel}`} data-scroll-anchor>
              <span className={labelCss.number}>{number}</span>
              <span>Skills</span>
              <span aria-hidden className={labelCss.rule} />
            </div>

            <m.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              {...reducedMotionProps}
              className="font-display mt-3 max-w-4xl text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance sm:whitespace-nowrap"
            >
              Tools I <span className="gradient-text">trust</span>
            </m.h2>
            <aside className={responsiveCss.quoteAnchor}>
              <blockquote className={responsiveCss.quote}>
                <Quote aria-hidden className={responsiveCss.quoteIcon} />
                <p>
                  Tools evolve.
                  <br />
                  Problem-solving endures.
                </p>
                <span aria-hidden className={responsiveCss.quoteAccent} />
              </blockquote>
            </aside>
            <p className={`${subtitleCss.subtitle} mt-4 max-w-xl`}>
              Infrastructure on one side, web and mobile development on the other.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.6fr]">
          <div aria-hidden className="hidden lg:block" />

          <div className="min-w-0">
            <div className="mb-5 text-center">
              <m.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                {...reducedMotionProps}
                className="border-brand-mid/30 bg-brand-mid/10 text-brand-bright inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[13px] font-medium"
              >
                <Zap className="fill-brand-mid text-brand-mid size-3.5" />
                My Toolbox
              </m.span>
            </div>
            {ordered.length > 0 && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                {...reducedMotionProps}
                className="flex flex-wrap items-center gap-2 max-lg:justify-center"
                role="tablist"
                aria-label="Filter skills by category"
              >
                {[MOST_USED, ...categories].map((value) => {
                  const selected = active === value;
                  return (
                    <m.button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(value)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      {...reducedMotionProps}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
                        selected
                          ? "border-brand-bright/60 bg-(image:--gradient-brand) text-white"
                          : "text-foreground/65 hover:border-brand-mid/40 hover:text-foreground border-white/12 bg-white/3 backdrop-blur-md"
                      }`}
                    >
                      {value}
                    </m.button>
                  );
                })}
              </m.div>
            )}

            <m.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              {...reducedMotionProps}
              className="mt-4 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4 [@media(orientation:landscape)_and_(max-width:1023px)_and_(max-height:500px)]:mx-auto [@media(orientation:landscape)_and_(max-width:1023px)_and_(max-height:500px)]:max-w-[640px]"
            >
              {/* Replace the whole group so rapid selections cannot retain exiting cards
                  or stale layout transforms from an earlier category. */}
              {visible.map((skill, index) => (
                <div key={`${skill.category}-${skill.name}`} className="min-w-0">
                  <SkillCard
                    name={skill.name}
                    iconPath={skill.iconPath}
                    category={skill.category}
                    level={skill.level}
                    index={index}
                  />
                </div>
              ))}
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Skills;
