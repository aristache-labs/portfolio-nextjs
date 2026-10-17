import { createElement } from "react";
import {
  AppWindow,
  Cloud,
  Code,
  Database,
  Globe,
  type LucideIcon,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import { ICON_PROPS, IconTile } from "@/components/ui/IconTile";
import type { ServiceRow } from "./Services";

/** Names an admin can type in the icon field. A small set keeps the bundle from pulling in
 *  every lucide icon, which `import * as Icons` did. */
const ICONS: Record<string, LucideIcon> = {
  AppWindow,
  Cloud,
  Code,
  Database,
  Globe,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  Wrench,
};

/** Seeded services carry no icon, so the title picks one. First match wins. */
const BY_TITLE: [RegExp, LucideIcon][] = [
  [/mobile|app store|ios|android/i, Smartphone],
  [/web/i, AppWindow],
  [/cloud/i, Cloud],
  [/automation|tool|script/i, Workflow],
  [/support|troubleshoot|repair/i, Wrench],
  [/system|infrastructure|server|devops/i, Server],
  [/data/i, Database],
  [/security/i, ShieldCheck],
  [/api|backend/i, Code],
];

export function resolveServiceIcon(service: Pick<ServiceRow, "icon" | "title">): LucideIcon {
  if (service.icon && ICONS[service.icon]) return ICONS[service.icon];
  return BY_TITLE.find(([pattern]) => pattern.test(service.title))?.[1] ?? Sparkles;
}

/** Every card shares one teal pairing (mid over deep) so icons and glows read as one system.
 *  Channel lists keep it palette- and theme-aware. */
const style = {
  "--c": "var(--brand-mid-rgb)",
  "--c2": "var(--brand-deep-rgb)",
} as React.CSSProperties;

export function ServiceCard({ service, index }: { service: ServiceRow; index: number }) {
  const icon = createElement(resolveServiceIcon(service), {
    className: "size-6",
    ...ICON_PROPS,
  });

  return (
    <article
      style={style}
      className="group hover:border-brand-mid/40 relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-(--bg) bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] p-5 backdrop-blur-[18px] transition-[border-color,transform,box-shadow] duration-300 hover:shadow-[0_16px_50px_rgb(var(--brand-mid-rgb)/0.22)] motion-safe:hover:-translate-y-0.5 sm:p-6"
    >
      {/* Hairline draws in along the top edge. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,rgb(var(--c)),rgb(var(--c2)))] transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none"
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Gradient ring (p-px) around a tinted tile: the icon shares its card's colours. */}
        <IconTile size="lg">{icon}</IconTile>
        <span className="bg-[linear-gradient(180deg,rgb(var(--c)/0.9),rgb(var(--c2)/0.1))] bg-clip-text font-mono text-5xl leading-none font-light tracking-tight text-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="relative mt-6 text-xl leading-snug font-bold tracking-tight">
        {service.title}
      </h3>
      <p className="text-muted relative mt-3 text-sm leading-relaxed text-pretty">
        {service.description}
      </p>

      {service.shortDescription && (
        <div className="relative mt-auto pt-6">
          <p className="text-foreground/85 flex items-start gap-2.5 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/0.07),rgb(255_255_255/0.02))] px-3.5 py-3 text-xs">
            <span
              aria-hidden
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,rgb(var(--c)),rgb(var(--c2)))] shadow-[0_0_8px_rgb(var(--c)/0.9)]"
            />
            {service.shortDescription}
          </p>
        </div>
      )}
    </article>
  );
}
