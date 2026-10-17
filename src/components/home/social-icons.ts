import { Github, Globe, Instagram, Linkedin, Mail, Send, type LucideIcon } from "lucide-react";
import { createElement, type ComponentType, type SVGProps } from "react";
import { XIcon } from "@/components/brand/XIcon";
import iconFiles from "../../../public/icons/manifest.json";

export type SocialIcon = ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;

const ICONS: Record<string, SocialIcon> = {
  github: Github,
  linkedin: Linkedin,
  twitter: XIcon,
  x: XIcon,
  instagram: Instagram,
  telegram: Send,
  email: Mail,
};

export function platformIcon(platform: string): SocialIcon {
  return ICONS[platform.toLowerCase()] ?? Globe;
}

function iconKey(value: string) {
  return value.toLowerCase().replace(/[\s._-]/g, "");
}

const ICON_SRC = new Map(
  iconFiles.map((file) => [iconKey(file.replace(/\.svg$/i, "")), file] as const),
);

/** Names an admin might type that do not match the file. */
const ICON_ALIAS: Record<string, string> = {
  x: "twitter",
  codepen: "codeopen",
};

/** Colored SVG for a platform, or null when public/icons has no match. */
export function socialIconSrc(platform: string): string | null {
  const key = ICON_ALIAS[iconKey(platform)] ?? iconKey(platform);
  const file = ICON_SRC.get(key);
  return file ? `/icons/${encodeURIComponent(file)}` : null;
}

/** Brand SVG when one exists, otherwise the Lucide fallback. */
export function SocialGlyph({ platform, className }: { platform: string; className?: string }) {
  const src = socialIconSrc(platform);
  if (src) {
    return createElement("img", { src, alt: "", "aria-hidden": true, className });
  }
  return createElement(platformIcon(platform), { className, "aria-hidden": true });
}

export type SocialRow = {
  platform: string;
  url: string;
  username: string;
  order: number;
};
