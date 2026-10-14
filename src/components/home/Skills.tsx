import { Reveal } from "@/components/motion/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { SkillCard } from "./SkillCard";

export type SkillRow = {
  name: string;
  iconPath: string;
  category: string;
  order: number;
};

function groupByCategory(skills: SkillRow[]) {
  const map = new Map<string, SkillRow[]>();
  for (const s of [...skills].sort((a, b) => a.order - b.order)) {
    const list = map.get(s.category) ?? [];
    list.push(s);
    map.set(s.category, list);
  }
  return [...map.entries()];
}

export function Skills({ skills }: { skills: SkillRow[] }) {
  const groups = groupByCategory(skills);

  return (
    <Section id="skills" className="scroll-mt-24">
      <Reveal>
        <SectionHeading number="03" eyebrow="Skills" title="Tools I work with" />
      </Reveal>

      {/* 12-col bento: cards pair up two per row and stretch to equal height;
          a trailing odd card spans the full width so no row ends ragged. */}
      <div className="grid gap-4 md:grid-cols-12 md:items-stretch md:gap-6">
        {groups.map(([category, items], i) => {
          const isLastOdd = groups.length % 2 === 1 && i === groups.length - 1;
          return (
            <Reveal
              key={category}
              delay={(i % 2) * 0.06}
              className={isLastOdd ? "h-full md:col-span-12" : "h-full md:col-span-6"}
            >
              <Card className="flex h-full flex-col p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-foreground/70 font-mono text-xs font-semibold tracking-[0.2em] uppercase">
                    {category}
                  </h3>
                  <span className="text-muted font-mono text-xs">
                    {String(items.length).padStart(2, "0")}
                  </span>
                </div>
                <ul className="grid grid-cols-3 content-start gap-2.5 sm:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
                  {items.map((s) => (
                    <SkillCard key={s.name} name={s.name} iconPath={s.iconPath} />
                  ))}
                </ul>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

export default Skills;
