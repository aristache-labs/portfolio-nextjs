import { ArrowRight, Github, Linkedin, Instagram, Send, Mail, Globe } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SectionBackdrop } from "./SectionBackdrop";
import { XIcon } from "@/components/brand/XIcon";

// Icons accept a className/size. Lucide icons and our custom XIcon both qualify.
export type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

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
  return ICONS[platform.toLowerCase()] ?? (Globe as SocialIcon);
}

export type SocialRow = {
  platform: string;
  url: string;
  username: string;
  order: number;
};

export function Contact({ socials, email }: { socials: SocialRow[]; email: string }) {
  const sorted = [...socials].sort((a, b) => a.order - b.order);

  return (
    <Section
      id="contact"
      className="scroll-mt-24"
      backdrop={<SectionBackdrop video="/media/contact.mp4" poster="/media/contact.webp" />}
    >
      <div>
        <Reveal>
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="text-muted mb-4 font-mono text-xs tracking-[0.3em] uppercase">
                Let&apos;s build something great
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                Ideas into real <span className="text-(--brand-mid)">solutions.</span>
              </h2>
            </div>
            <div className="flex flex-col items-start gap-6 lg:items-end">
              <p className="text-muted max-w-md text-base leading-relaxed lg:text-right">
                Whether you have a project in mind, need technical expertise, or just want to chat
                about technology - I&apos;m always open to new opportunities.
              </p>
              {email ? (
                <Magnetic>
                  <Button
                    href={`mailto:${email}`}
                    variant="secondary"
                    size="lg"
                    aria-label={`Get in Touch ${email}`}
                  >
                    Get in Touch <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Magnetic>
              ) : null}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {sorted.map((s) => {
              const Icon = platformIcon(s.platform);
              const isExternal = s.url.startsWith("http");
              return (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    aria-label={`${s.platform}: ${s.username}`}
                    {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="border-border text-muted hover:text-foreground hover:border-foreground/30 hover:bg-surface-2 focus-visible:ring-ring grid size-11 place-items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none motion-safe:transition-transform motion-safe:hover:scale-105"
                  >
                    <Icon className="size-5" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

export default Contact;
