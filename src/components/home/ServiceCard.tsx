import { createElement } from "react";
import Image from "next/image";
import styles from "./service-card.module.css";
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
import { ICON_PROPS } from "@/components/ui/IconTile";
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

export function resolveServiceImageSource(icon: string | null): string | null {
  if (!icon || !/^\/icons\/[\w-]+\.(?:svg|webp)$/i.test(icon)) return null;
  return icon.replace(/^(\/icons\/(?:react|html|windows))\.svg$/i, "$1.webp");
}

/** Compact summary using the same icon treatment as the other homepage sections. */
export function ServiceCard({ service }: { service: ServiceRow }) {
  const imageSource = resolveServiceImageSource(service.icon);
  const icon = imageSource ? (
    <Image
      src={imageSource}
      alt=""
      width={56}
      height={56}
      unoptimized
      className="relative z-10 size-14 object-contain"
    />
  ) : (
    createElement(resolveServiceIcon(service), { ...ICON_PROPS })
  );

  return (
    <article
      className={`${styles.card} group bg-surface/70 hover:border-brand-mid/40 flex h-full items-start gap-3 rounded-2xl border border-white/10 p-4 transition-colors duration-300 sm:p-5`}
    >
      <span className="grid size-14 shrink-0 place-items-center text-(--accent-on-chip) [&_svg]:size-6">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-foreground text-base leading-snug font-semibold tracking-tight 2xl:text-[15px] 2xl:whitespace-nowrap">
          {service.title}
        </h3>
        <p className="text-muted mt-1.5 text-sm leading-relaxed 2xl:text-[13px] 2xl:whitespace-nowrap">
          {service.shortDescription?.trim() || service.description}
        </p>
      </div>
    </article>
  );
}
