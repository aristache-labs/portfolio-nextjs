import type { ComponentProps } from "react";
import Link from "next/link";

type SectionLinkProps = ComponentProps<"a"> & {
  href: string;
  crossPage: boolean;
  scroll?: boolean;
};

/** Native fragment links avoid Next 16.2 appending hashes to a cached canonical URL. */
export function SectionLink({ crossPage, scroll, ...props }: SectionLinkProps) {
  if (crossPage || props.href.startsWith("#")) return <a {...props} />;
  return <Link {...props} scroll={scroll} />;
}
