---
name: Aristache
description: Technical, cinematic portfolio in the Obsidian dark theme.
colors:
  brand-deep: "#0f6e68"
  brand-mid: "#58e5d0"
  brand-bright: "#76f5e1"
  background: "#080c0d"
  foreground: "#f5f7f7"
  surface: "#11191b"
  surface-2: "#182225"
  border: "#253134"
  muted: "#a0adb1"
  overlay: "rgba(8, 12, 13, 0.92)"
typography:
  headline:
    fontFamily: "Sora, sans-serif"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, sans-serif"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
  control:
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  field: "0.5rem"
  panel: "1rem"
  pill: "9999px"
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
- **Mid turquoise** provides the brighter end of the action gradient and the keyboard focus ring.
- **Bright mint** colors labels on dark chips and starts the lighter text gradient used for selected headings, stats, and the wordmark.

### Neutral

- **Obsidian ground** sits below the card surface and its lighter hover tone. A cool hairline border delineates controls and panels.
- **Off-white ink** carries primary text. Muted gray carries supporting text and the resting ghost-button label.

The palette is maintained in [brand.ts](src/lib/brand.ts) and [globals.css](src/app/globals.css). Tailwind color aliases point to semantic CSS variables so opacity modifiers continue to work.

## Typography

Sora gives homepage display headings their weight and tight tracking. Shared cinematic section headings scale from 1.65rem to 3.5rem with an 800 weight. The root layout loads Geist Sans, while the cinematic scope supplies a system sans utility stack. Geist Mono is registered after page load for technical labels, with system monospace fallbacks available immediately.

## Layout

The hero, navigation, shared sections, and footer use a centered container capped at 86rem. Inline gutters scale from 1.5rem to 2.75rem and honor safe-area insets. Navigation switches from the compact menu to desktop chrome at the Tailwind xl breakpoint. Short landscape touch screens scale the root type and spacing with viewport height while preserving minimum small-text sizes. Section visibility is managed through admin settings.

## Elevation & Depth

Cards use tonal surfaces and thin borders, with a lighter surface and border on hover. The primary action adds a diffuse teal shadow. Scrolled navigation uses a translucent ground, blur, and a dark shadow. Dialogs combine a dark backdrop with a blurred panel and stronger elevation. Homepage sections use poster imagery and conditionally play background video, with static media for reduced-motion visitors.

## Shapes

Pill buttons and compact tags contrast with the 1rem corners of cards and dialogs. Admin fields use 0.5rem corners and a fine border. The existing Aristache monogram remains the brand mark.

## Components

- **Buttons.** Primary uses the teal gradient with a shifting background position on hover. Secondary uses a surfaced outline. Ghost uses muted text that brightens on hover. Shared controls use a visible keyboard focus ring and motion-safe lift and press feedback.
- **Cards.** The shared card uses the first surface tone, a hairline border, and 1.5rem padding. Hover raises the surface tone.
- **Admin fields.** Inputs, textareas, and selects share the page ground, muted placeholder, and turquoise focus ring. Disabled fields reduce opacity.
- **Navigation.** The fixed public nav gains a blurred background after scrolling. The compact menu opens a bounded, scrollable panel below the header.
- **Dialogs.** The Radix primitive pairs a dark overlay with a rounded panel and a circular close control. Project Quick View uses this overlay pattern to surface project media and repository details.
- **Section motion.** Homepage entrances and overlays use opacity and transform effects. The terminal intro is configurable, and the homepage provides a reduced-motion path.

## Do's and Don'ts

- **Do** use semantic surface, text, border, and ring tokens on public and admin routes.
- **Do** use the brighter ink gradient for gradient text and the brand gradient for action fills.
- **Do** use the brand RGB channel variables when giving decorative glows an alpha value.
- **Do** preserve keyboard focus treatments and static media under reduced motion.
- **Don't** add a separate runtime palette or an unlayered global reset.
