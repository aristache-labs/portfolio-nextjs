"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import { ArrowRight, BarChart3, Code2, Heart, Quote, Zap, type LucideIcon } from "lucide-react";
import { SkillCard } from "./SkillCard";
import { SectionBackdrop } from "./SectionBackdrop";
import motionCss from "./skills-motion.module.css";

export type SkillRow = {
  name: string;
  iconPath: string;
  category: string;
  order: number;
  level?: string | null;
};

const ALL = "All";
/** Homepage filter order. Tabs still appear only when a skill uses that category. */
const CATEGORY_ORDER = ["Development", "Infrastructure", "Automation", "Data & Cloud"];
/** Default tab keeps the grid to one screen. A category pill reveals that group. */
const ALL_LIMIT = 8;

function byOrder(skills: SkillRow[]) {
  return [...skills].sort((a, b) => a.order - b.order);
}

/** All shows this set first. Aliases cover the stored names. */
const ALL_FIRST: { aliases: string[]; label: string }[] = [
  { aliases: ["powershell"], label: "PowerShell" },
  { aliases: ["windows server", "windows"], label: "Windows Server" },
  { aliases: ["linux"], label: "Linux" },
  { aliases: ["typescript"], label: "TypeScript" },
  { aliases: ["react"], label: "React" },
  { aliases: ["next.js", "nextjs"], label: "Next.js" },
  { aliases: ["react native"], label: "React Native" },
  { aliases: ["sql", "postgresql", "mysql"], label: "SQL" },
];

function allTabSkills(ordered: SkillRow[]) {
  const remaining = [...ordered];
  const picked: SkillRow[] = [];
  for (const slot of ALL_FIRST) {
    let index = -1;
    for (const alias of slot.aliases) {
      index = remaining.findIndex((skill) => skill.name.trim().toLowerCase() === alias);
      if (index >= 0) break;
    }
    if (index < 0) continue;
    const [skill] = remaining.splice(index, 1);
    picked.push({ ...skill, name: slot.label });
  }
  if (picked.length === 0) return ordered.slice(0, ALL_LIMIT);
  for (const skill of remaining) {
    if (picked.length >= ALL_LIMIT) break;
    picked.push(skill);
  }
  return picked;
}

function techCount(total: number) {
  if (total <= 0) return "0";
  if (total < 10) return String(total);
  return `${Math.floor(total / 5) * 5}+`;
}

export function Skills({ skills }: { skills: SkillRow[] }) {
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

  const [filter, setFilter] = useState(ALL);
  const active = filter !== ALL && categories.includes(filter) ? filter : ALL;
  const visible =
    active === ALL ? allTabSkills(ordered) : ordered.filter((s) => s.category === active);

  const stats: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Code2, value: techCount(skills.length), label: "Technologies & Tools" },
    { icon: Zap, value: "IT + Dev", label: "Dual Expertise" },
    { icon: BarChart3, value: "Automation", label: "Engineering Mindset" },
    { icon: Heart, value: "Always", label: "Learning & Improving" },
  ];

  const scrollToProjects = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="skills" className="relative z-10 scroll-mt-20 overflow-x-clip overflow-y-visible">
      <SectionBackdrop
        frame="screen"
        focus="left"
        video="/media/skills.mp4"
        poster="/media/skills.webp"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-6 pb-10 sm:px-8 md:pt-8">
        <div className="lg:grid lg:grid-cols-[0.8fr_1.6fr] lg:gap-6">
          <div aria-hidden className="hidden lg:block" />
          <div className="min-w-0 text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="border-brand-mid/30 bg-brand-mid/10 text-brand-bright inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[13px] font-medium"
            >
              <Zap className="fill-brand-mid text-brand-mid size-3.5" />
              My Toolbox
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display mx-auto mt-3 max-w-4xl text-[clamp(1.65rem,3.4vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight whitespace-nowrap"
            >
              Skills that build <span className="gradient-text">possibilities</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-foreground/55 mx-auto mt-2 max-w-2xl text-sm sm:text-base"
            >
              A curated set of technologies, tools and skills I use to turn ideas into reality.
            </motion.p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.6fr]">
          <div aria-hidden className="hidden lg:block" />

          <div className="min-w-0">
            {ordered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap items-center gap-2"
                role="tablist"
                aria-label="Filter skills by category"
              >
                {[ALL, ...categories].map((value) => {
                  const selected = active === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(value)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                        selected
                          ? "border-brand-bright/60 bg-(image:--gradient-brand) text-white"
                          : "text-foreground/65 hover:border-brand-mid/40 hover:text-foreground border-white/12 bg-white/3 backdrop-blur-md"
                      }`}
                    >
                      {value}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
            {active === ALL && ordered.length > ALL_LIMIT && (
              <p className="text-foreground/60 mt-2.5 text-xs">
                Showing {visible.length} of {ordered.length} - select a category to explore
                everything.
              </p>
            )}

            <motion.div
              layout
              className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {visible.map((skill, index) => (
                  <motion.div
                    key={`${skill.category}-${skill.name}`}
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
                    className="min-w-0"
                  >
                    <SkillCard
                      name={skill.name}
                      iconPath={skill.iconPath}
                      category={skill.category}
                      level={skill.level}
                      index={index}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-background/40 relative mx-auto mt-12 max-w-sm rounded-xl border border-white/10 px-8 pt-6 pb-4 backdrop-blur-xl"
        >
          <Quote
            aria-hidden
            className={`${motionCss.float} text-brand-bright fill-brand-mid absolute -top-3 left-4 size-6 drop-shadow-[0_0_12px_rgb(var(--brand-mid-rgb)/0.9)]`}
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
        </motion.figure>

        <div className="mt-6 grid items-end gap-4 lg:-mt-10 lg:grid-cols-[1fr_280px]">
          <div className="flex min-w-0 flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] px-5 py-4 shadow-[0_20px_60px_rgb(0_0_0/0.4)] backdrop-blur-[18px] sm:px-6"
            >
              <span
                aria-hidden
                className={`${motionCss.lightning} via-brand-bright absolute top-0 left-0 h-px w-1/4 bg-gradient-to-r from-transparent to-transparent shadow-[0_0_12px_rgb(var(--brand-bright-rgb)/0.9)]`}
              />

              <span className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <span
                    key={stat.label}
                    className={`flex min-w-0 items-center gap-3 ${index !== 0 ? "lg:border-l lg:border-white/10 lg:pl-5" : ""}`}
                  >
                    <IconTile size="sm">
                      <stat.icon className="size-[18px]" {...ICON_PROPS} />
                    </IconTile>
                    <span className="min-w-0">
                      <span className="font-display block text-lg leading-tight font-bold">
                        {stat.value}
                      </span>
                      <span className="text-foreground/50 block text-[11px] break-words">
                        {stat.label}
                      </span>
                    </span>
                  </span>
                ))}
              </span>
            </motion.div>
          </div>

          <motion.a
            href="#projects"
            onClick={scrollToProjects}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -4 }}
            className="group border-brand-mid/30 from-brand-deep/25 via-background/80 to-brand-mid/20 hover:border-brand-bright/60 relative flex min-w-0 items-center justify-between gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl transition-colors hover:shadow-[0_20px_60px_rgb(var(--brand-mid-rgb)/0.35)]"
            aria-label="Back to projects"
          >
            <span
              className={`${motionCss.hand} text-brand-bright text-[28px] leading-[1.05] font-semibold`}
            >
              Better
              <br />
              Projects
              <br />
              Ahead...
            </span>
            <span className="border-brand-bright/50 group-hover:bg-brand-mid/25 flex size-12 shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover:shadow-[0_0_24px_rgb(var(--brand-mid-rgb)/0.6)]">
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}

export default Skills;
