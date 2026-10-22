"use client";

import { useMemo, useState } from "react";
import { m } from "framer-motion";
import { useReducedMotionProps } from "@/hooks/useReducedMotion";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { BarChart3, Code2, Heart, Quote, Zap, type LucideIcon } from "lucide-react";
import { SkillCard, skillPercent } from "./SkillCard";
import { SectionBackdrop } from "./SectionBackdrop";
import statsCss from "./about-stats.module.css";
import quoteCss from "./skills-quote.module.css";

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

function techCount(total: number) {
  if (total <= 0) return "0";
  if (total < 10) return String(total);
  return `${Math.floor(total / 5) * 5}+`;
}

export function Skills({ skills }: { skills: SkillRow[] }) {
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

  const stats: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Code2, value: techCount(skills.length), label: "Technologies & Tools" },
    { icon: Zap, value: "IT + Dev", label: "Dual Expertise" },
    { icon: BarChart3, value: "Automation", label: "Engineering Mindset" },
    { icon: Heart, value: "Always", label: "Learning & Improving" },
  ];

  return (
    <section
      id="skills"
      className="relative z-10 scroll-mt-20 overflow-x-clip overflow-y-visible md:scroll-mt-12"
    >
      <SectionBackdrop
        frame="screen"
        focus="left"
        video="/media/skills.mp4"
        poster="/media/skills.webp"
        fetchPriority="low"
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-5 pt-6 pb-10 sm:px-8 md:pt-8 lg:block">
        <div className="lg:grid lg:grid-cols-[0.8fr_1.6fr] lg:gap-6">
          <div aria-hidden className="hidden lg:block" />
          <div className="min-w-0 text-center">
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

            <m.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              {...reducedMotionProps}
              className="font-display mx-auto mt-3 max-w-4xl text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance sm:whitespace-nowrap"
            >
              Skills that build <span className="gradient-text">possibilities</span>
            </m.h2>

            <m.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              {...reducedMotionProps}
              className="text-foreground/55 mx-auto mt-2 max-w-2xl text-sm sm:text-base"
            >
              A curated set of technologies, tools and skills I use to turn ideas into reality.
            </m.p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.6fr]">
          <div aria-hidden className="hidden lg:block" />

          <div className="min-w-0">
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
            {active === MOST_USED && ordered.length > MOST_USED_LIMIT && (
              <p className="text-foreground/60 mt-2.5 text-xs max-lg:text-center">
                My {visible.length} most-used skills - explore all {ordered.length} by category.
              </p>
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

        <m.figure
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          {...reducedMotionProps}
          className={`${quoteCss.quoteCard} bg-background/40 relative order-last mx-auto mt-8 w-full max-w-sm rounded-xl border border-white/10 px-8 pt-6 pb-4 backdrop-blur-xl lg:order-none lg:mt-12`}
        >
          <Quote
            aria-hidden
            className="text-brand-bright fill-brand-mid absolute -top-3 left-4 size-6"
          />
          <blockquote className="text-foreground/85 text-sm leading-relaxed">
            Tools evolve.
            <br />
            Problem-solving endures.
          </blockquote>
          <span
            aria-hidden
            className="bg-brand-mid mx-auto mt-2.5 block h-[2px] w-10 rounded-full shadow-[0_0_10px_rgb(var(--brand-mid-rgb)/0.9)]"
          />
        </m.figure>

        <div className="mt-6">
          <div className="flex min-w-0 flex-col gap-4">
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              {...reducedMotionProps}
              className={`${statsCss.panel} relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] px-5 py-4 shadow-[0_20px_60px_rgb(0_0_0/0.4)] backdrop-blur-[18px] sm:px-6`}
            >
              <span
                aria-hidden
                className="via-brand-mid/40 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
              />

              <span className={`${statsCss.grid} grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4`}>
                {stats.map((stat, index) => (
                  <span
                    key={stat.label}
                    className={`${statsCss.item} flex min-w-0 items-center gap-3 ${index !== 0 ? "lg:border-l lg:border-white/10 lg:pl-4" : ""}`}
                  >
                    <IconTile size="sm">
                      <stat.icon className="size-[18px]" {...ICON_PROPS} />
                    </IconTile>
                    <span className="min-w-0">
                      <span
                        className={`${stat.value === techCount(skills.length) ? statsCss.numberValue : statsCss.textValue} font-display block text-base leading-tight font-semibold`}
                      >
                        {stat.value}
                      </span>
                      <span
                        className={`${statsCss.label} text-foreground/50 block text-[11px] break-words`}
                      >
                        {stat.label}
                      </span>
                    </span>
                  </span>
                ))}
              </span>
            </m.div>
          </div>
        </div>
        <figure className={quoteCss.landscapeQuote}>
          <blockquote>&ldquo;Tools evolve. Problem-solving endures.&rdquo;</blockquote>
          <figcaption>- ADRIAN</figcaption>
        </figure>
      </div>
    </section>
  );
}

export default Skills;
