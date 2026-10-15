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

export function ServiceCard({ service, index }: { service: ServiceRow; index: number }) {
  const icon = createElement(resolveServiceIcon(service), {
    className: "size-5",
    strokeWidth: 1.75,
    "aria-hidden": true,
  });

  return (
    <article className="group border-border bg-surface relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-colors hover:border-(--brand-deep)/40">
      {/* Brand hairline that draws in along the top edge on hover. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-(image:--gradient-brand) transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none"
      />

      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-xl border border-(--brand-deep)/40 bg-(--chip-surface) text-(--accent-on-chip) transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5">
          {icon}
        </span>
        <span className="text-muted font-mono text-xs tracking-[0.2em]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="mt-6 text-lg leading-snug font-bold">{service.title}</h3>
      <p className="text-muted mt-2 text-sm text-pretty">{service.description}</p>

      {service.shortDescription && (
        <div className="mt-auto pt-6">
          <p className="border-border text-foreground/70 flex items-start gap-2 border-t pt-4 text-xs">
            <span
              aria-hidden
              className="mt-1.5 size-1 shrink-0 rounded-full bg-(--accent-on-chip)"
            />
            {service.shortDescription}
          </p>
        </div>
      )}
    </article>
  );
}
