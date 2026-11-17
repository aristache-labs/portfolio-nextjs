---
name: Aristache
description: Technical, cinematic portfolio in the Obsidian dark theme.
colors:
  brand-deep: "#0f6e68"
  brand-mid: "#58e5d0"
  brand-bright: "#76f5e1"
  brand-action-end: "#1f8478"
  background: "#080c0d"
  foreground: "#f5f7f7"
  surface: "#11191b"
  surface-2: "#182225"
  border: "#253134"
  muted: "#a0adb1"
  overlay: "rgba(8, 12, 13, 0.92)"
  white: "#ffffff"
  black: "#000000"
  terminal-ground: "#0d1117"
  terminal-bar: "#161b22"
  terminal-border: "#30363d"
  terminal-ink: "#e6edf3"
  terminal-muted: "#8b949e"
  terminal-close: "#ff5f57"
  terminal-minimize: "#febc2e"
  terminal-zoom: "#28c840"
  mint-ink: "#d7fbf6"
typography:
  headline:
    fontFamily: "Sora, sans-serif"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, sans-serif"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
  control:
    fontSize: "0.875rem"
    fontWeight: 500
  text-10:
    fontSize: "10px"
  text-11:
    fontSize: "11px"
  text-12:
    fontSize: "12px"
  text-13:
    fontSize: "13px"
  text-14:
    fontSize: "14px"
  text-15:
    fontSize: "15px"
  text-16:
    fontSize: "16px"
  text-17:
    fontSize: "17px"
  text-18:
    fontSize: "18px"
  text-20:
    fontSize: "20px"
  text-22:
    fontSize: "22px"
rounded:
  field: "0.5rem"
  panel: "1rem"
  pill: "9999px"
  tile: "0.75rem"
  chip: "9px"
  control: "10px"
  card-sm: "14px"
  card-lg: "18px"
spacing:
  control-gap: "0.5rem"
  panel-padding: "1.5rem"
  site-max: "86rem"
components:
  button-primary:
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1.25rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
  admin-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
  dialog:
    backgroundColor: "{colors.overlay}"
    rounded: "{rounded.panel}"
---

# Design System: Aristache

## Overview

**Creative North Star: "Obsidian dark"**

Aristache has a technical, cinematic visual identity. Section media, near-black surfaces, and turquoise accents give the homepage depth. The same dark palette carries through navigation, dialogs, and the admin interface.

## Colors

### Primary

- **Deep teal** anchors the action gradient and supplies the RGB channels for colored glows.
- **Mid turquoise** provides the bright end of the decorative brand gradient and the keyboard focus ring.
- **Action gradient** (`--gradient-brand-action`, deep teal to `#1f8478`) is the only fill that may sit under white text: white clears 4.5:1 across the whole ramp. `--gradient-brand` (to mid turquoise) stays decorative: avatar ring, timeline line, icons.
- **Bright mint** colors labels on dark chips and starts the lighter text gradient used for selected headings, stats, and the wordmark.

### Neutral

- **Obsidian ground** sits below the card surface and its lighter hover tone. A cool hairline border delineates controls and panels.
- **Off-white ink** carries primary text. Muted gray carries supporting text and the resting ghost-button label.

The palette is maintained in [brand.ts](src/lib/brand.ts) and [globals.css](src/app/globals.css). Tailwind color aliases point to semantic CSS variables so opacity modifiers continue to work.

## Typography

Small text has a floor. Functional text (chips, pills, status labels, navigation, meta rows) is never below **11px**; the footer legal line and decorative micro-copy may go to 10px. The sizes in use are 11, 12, 13, 14, 15, 16 and 17px for UI and body; display headings scale up from there. Letter spacing above 0.05em is reserved for short uppercase labels (section label, chips), never for sentences.

Sora gives homepage display headings their weight and tight tracking. Shared cinematic section headings scale from 1.65rem to 3.5rem and request Sora at CSS weight 500. Chrome reports the underlying font face as Sora-SemiBold for the sampled heading glyphs. The root layout loads Geist Sans, while the cinematic scope supplies a system sans utility stack. Geist Mono is registered after page load for technical labels, with system monospace fallbacks available immediately.

## Layout

The hero, navigation, shared sections, and footer use a centered container capped at 86rem. Inline gutters scale from 1.5rem to 2.75rem and honor safe-area insets. Navigation switches from the compact menu to desktop chrome at the Tailwind xl breakpoint. Short landscape touch screens scale the root type and spacing with viewport height while preserving minimum small-text sizes. Section visibility is managed through admin settings.

## Elevation & Depth

Cards use tonal surfaces and thin borders, with a lighter surface and border on hover. The primary action adds a diffuse teal shadow. Scrolled navigation uses a translucent ground, blur, and a dark shadow. Dialogs combine a dark backdrop with a blurred panel and stronger elevation. Homepage sections use poster imagery and conditionally play background video, with static media for reduced-motion visitors.

## Shapes

Pill buttons and compact tags contrast with the 1rem corners of cards and dialogs. Radii in use: 8px (fields), 12px (tiles), 16px (cards, dialogs), 999px (pills); 9, 10, 14 and 18px are the shared variables `--radius-chip`, `--radius-control`, `--radius-card-sm` and `--radius-card-lg`. Admin fields use 0.5rem corners and a fine border. The existing Aristache monogram remains the brand mark.

## Components

- **Buttons.** Primary uses the action gradient with a shifting background position on hover. Secondary uses a surfaced outline. Ghost uses muted text that brightens on hover. Shared controls use a visible keyboard focus ring and motion-safe lift and press feedback.
- **Cards.** The shared card uses the first surface tone, a hairline border, and 1.5rem padding. Hover raises the surface tone.
- **Admin fields.** Inputs, textareas, and selects share the page ground, muted placeholder, and turquoise focus ring. Disabled fields reduce opacity.
- **Navigation.** The fixed public nav applies blur immediately when it becomes compact. Background color, border color, and shadow transition over 300 ms. The compact menu opens a bounded, scrollable panel below the header. The panel and backdrop enter together in 180 ms and fade out together in 140 ms. Escape closes the menu immediately and restores focus to its toggle. Reduced motion skips the menu animation.
- **Dialogs.** The Radix primitive pairs a dark overlay with a rounded panel and a circular close control. Project Quick View uses this overlay pattern to surface project media and repository details.
- **Section label.** `SectionLabel` ("01 ABOUT") is the one pattern above every section title: a laser beam runs under it once, lights the letters and leaves the separator. `delayMs` holds the beam while the label fades in.
- **Section heading entrance.** Every heading enters as About does: the label first, then the title words rising out of a blur, then the accent underline draws, then the subtitle. `AboutReveal` arms and plays it; `HeadingWords` splits the title.
- **Section motion.** Homepage entrances and overlays use opacity and transform effects. The terminal intro is configurable, and the homepage provides a reduced-motion path.

## Do's and Don'ts

- **Do** use semantic surface, text, border, and ring tokens on public and admin routes.
- **Do** use the brighter ink gradient for gradient text and the action gradient for fills under white text.
- **Do** keep functional text at 11px or larger.
- **Do** use the brand RGB channel variables when giving decorative glows an alpha value.
- **Do** preserve keyboard focus treatments and static media under reduced motion.
- **Don't** put white text on `--gradient-brand`; use `--gradient-brand-action`.
- **Don't** add a separate runtime palette or an unlayered global reset.

## Accepted Exceptions

Known and decided; detectors may keep reporting them.

- **Non-composited animations.** The About blur ("focus in") filters are the approved look, and the rotate-hint arc animates `stroke-dashoffset` once on a small element. Both cost little.
- **Mobile Total Blocking Time (200-330 ms).** React hydration plus framer-motion. The fix, deferred hydration, would touch the approved animations, so it is accepted.
- **Intro curtain "covered text".** The terminal intro is a fixed, opaque, `aria-hidden` layer above the hero. Detectors see its lines overlapping hero text while it runs. The terminal timeline runs for 5 s. A 6.5 s fallback hides the curtain if the normal dismissal does not run.
