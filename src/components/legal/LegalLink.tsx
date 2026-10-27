import type { ReactNode } from "react";

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-bright underline underline-offset-4"
    >
      {children}
    </a>
  );
}
