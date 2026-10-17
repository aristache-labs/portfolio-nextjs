import { Github, Globe, Instagram, Linkedin, Mail, Send, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { XIcon } from "@/components/brand/XIcon";

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

export type SocialRow = {
  platform: string;
  url: string;
  username: string;
  order: number;
};
