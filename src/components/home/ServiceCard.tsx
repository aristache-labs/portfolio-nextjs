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
    strokeWidth: 1.6,
    "aria-hidden": true,
  });

  return (
    <article
      style={style}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-(--brand-mid)/25 bg-[linear-gradient(160deg,rgb(var(--c)/0.08),transparent_55%),var(--surface)] p-5 backdrop-blur-md transition-[border-color,transform,box-shadow] duration-300 hover:border-[rgb(var(--c)/0.45)] hover:shadow-[0_18px_44px_-28px_rgb(var(--c)/0.45)] motion-safe:hover:-translate-y-0.5 sm:p-6"
    >
      {/* Dot-grid texture in the card's own colour, fading out from the top-right corner. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 size-40 bg-[radial-gradient(rgb(var(--c)/0.55)_1px,transparent_1.5px)] [mask-image:radial-gradient(closest-side_at_100%_0%,black,transparent)] bg-[length:12px_12px] opacity-50 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* Two-tone glow that blooms behind the icon on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(var(--c2)/0.22),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* Hairline in the card's two colours draws in along the top edge. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,rgb(var(--c)),rgb(var(--c2)))] transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none"
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Gradient ring (p-px) around a tinted tile: the icon shares its card's colours. */}
        <span className="rounded-2xl bg-[linear-gradient(135deg,rgb(var(--c)/0.9),rgb(var(--c2)/0.35))] p-px shadow-[0_8px_20px_-14px_rgb(var(--c)/0.5)] transition-shadow duration-300 group-hover:shadow-[0_8px_24px_-12px_rgb(var(--c)/0.7)]">
          <span className="grid size-14 place-items-center rounded-[15px] bg-[linear-gradient(135deg,rgb(var(--c)/0.30),rgb(var(--c2)/0.12)),var(--chip-surface)] text-(--accent-on-chip)">
            {icon}
          </span>
        </span>
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
          <p className="text-foreground/85 flex items-start gap-2.5 rounded-xl border border-[rgb(var(--c)/0.25)] bg-[rgb(var(--c)/0.07)] px-3.5 py-3 text-xs">
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
