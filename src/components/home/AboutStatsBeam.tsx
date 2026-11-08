"use client";

import { BorderBeam } from "@/components/ui/border-beam";

// The package scopes {id} to this instance. Keep the effect on the perimeter and use
// the site's brand tokens so the beam follows future palette changes.
const BEAM_CSS = `
  [data-beam="{id}"] {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  [data-beam="{id}"][data-active]::after,
  [data-beam="{id}"][data-fading]::after {
    padding: 1px;
    border-radius: inherit;
    background: conic-gradient(
      from var(--beam-angle-{id}),
      transparent 0% 55%,
      rgb(var(--brand-deep-rgb) / 0.5) 65%,
      var(--brand-mid) 76%,
      var(--brand-bright) 82%,
      rgb(var(--brand-mid-rgb) / 0.3) 88%,
      transparent 95% 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    opacity: 0.85;
    filter: none;
  }

  [data-beam="{id}"][data-beam]::before,
  [data-beam="{id}"][data-beam] [data-beam-bloom] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-beam="{id}"][data-active],
    [data-beam="{id}"][data-fading] {
      animation: none;
      --beam-angle-{id}: 120deg;
    }
  }
`;

/** Decorative overlay: preserves the results panel's layout and readable content. */
export function AboutStatsBeam() {
  return (
    <BorderBeam
      aria-hidden="true"
      size="sm"
      theme="dark"
      colorVariant="ice"
      staticColors
      duration={8}
      borderRadius={16}
      css={BEAM_CSS}
    >
      <span />
    </BorderBeam>
  );
}
