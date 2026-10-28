import type { ComponentProps } from "react";
import Link from "next/link";

type SectionLinkProps = ComponentProps<"a"> & {
  href: string;
  crossPage: boolean;
  scroll?: boolean;
};

/** Cross-page anchors need a fresh document to avoid cached fragments in Next 16.2. */
export function SectionLink({ crossPage, scroll, ...props }: SectionLinkProps) {
  if (crossPage) return <a {...props} />;
  return (
    <Link {...props} scroll={scroll} prefetch={props.href.startsWith("#") ? false : undefined} />
  );
}
