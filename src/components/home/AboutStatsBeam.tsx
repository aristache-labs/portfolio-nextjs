"use client";

import { BorderBeam } from "@/components/ui/border-beam";

// The package scopes {id} to this instance. The stroke and soft inner edge share
// a rotating spectrum built from the brand and complementary tokens in globals.css.
const BEAM_CSS = `
  [data-beam="{id}"] {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  [data-beam="{id}"][data-active]::after,
  [data-beam="{id}"][data-fading]::after,
  [data-beam="{id}"][data-active]::before,
  [data-beam="{id}"][data-fading]::before {
    border-radius: inherit;
    clip-path: none;
    background: conic-gradient(
      from var(--beam-angle-{id}),
      var(--brand-mid) 0%,
      var(--beam-cyan) 16%,
      transparent 27%,
      var(--beam-blue) 38%,
      var(--beam-mint) 53%,
      transparent 64%,
      var(--brand-mid) 74%,
      var(--beam-cyan) 85%,
      var(--beam-blue) 94%,
      var(--brand-mid) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }

  [data-beam="{id}"][data-active]::after,
  [data-beam="{id}"][data-fading]::after {
    padding: 1px;
    opacity: 0.7;
    filter: none;
  }

  [data-beam="{id}"][data-active]::before,
  [data-beam="{id}"][data-fading]::before {
    padding: 0;
    -webkit-mask:
      linear-gradient(#fff, transparent 6px, transparent calc(100% - 6px), #fff),
      linear-gradient(90deg, #fff, transparent 6px, transparent calc(100% - 6px), #fff);
    -webkit-mask-composite: source-over;
    mask:
      linear-gradient(#fff, transparent 6px, transparent calc(100% - 6px), #fff),
      linear-gradient(90deg, #fff, transparent 6px, transparent calc(100% - 6px), #fff);
    mask-composite: add;
    box-shadow: none;
    opacity: 0.12;
    filter: blur(3px);
  }

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
