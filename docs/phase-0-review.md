# Phase 0 review handoff

Implementation remains uncommitted on `codex/refine-hero-about-motion`. The owner subsequently authorized applying migration 0027 and reviewing the homepage. That migration is now applied. No content save, upload, commit, push or extra server was performed.

## Database boundary

`drizzle/0027_project_groups.sql` adds only a nullable `projects.group` text column. The generated snapshot and migration journal accompany it. Generation originally used a dummy connection string for offline schema generation. On the owner's follow-up authorization, the migration was applied to the configured Neon database through Drizzle's migrator after verifying that 0027 was the only pending migration.

Post-migration verification confirmed a nullable text column and matching migration hash in Drizzle's ledger. All 12 project rows were preserved: an aggregate fingerprint of every project field except the newly added column matched before and after migration. All 12 group values remain null. The homepage now serves successfully; HTTP 200 was confirmed in the browser navigation timing. The earlier HTTP 500 and sandbox DNS failures are historical, resolved for this authorized migration and review by using network-enabled execution.

Do not run the seed to populate groups. Group and content values are still entered by the owner through admin. No real grouped card or component selector can be reviewed until content is assigned to groups; existing fixture tests cover that behavior.

## Homepage review after migration

All five requested sizes were checked on the existing localhost:4000 server with full-page scrolling down and back up, Hero and Projects screenshots, initial source assignment checks, loaded-cover checks and console inspection.

| Emulated viewport | Horizontal overflow during scroll | Initial active project covers | Broken loaded covers | Console |
| --- | --- | --- | --- | --- |
| 1440 x 900 | None | 0 | 0 | No errors or warnings |
| 1024 x 768 | None | 0 | 0 | No errors or warnings |
| 390 x 844, touch | None | 0 | 0 | No errors or warnings |
| 375 x 812, touch | None | 0 | 0 | No errors or warnings |
| 812 x 375, touch landscape | None | 0 | 0 | Hero poster preload warning only |

H1 DOM text is consistently `Adrian Cristache Infrastructure meets innovation.` with no duplicate name. The sampled project card paragraphs have 137, 132 and 138 characters. Existing editorial content and featured selection remain unchanged. Portrait retains the native horizontal featured carousel and no Hero video; landscape still mounts its existing Hero video.

Quick View was opened on the portfolio card in portrait and landscape. Its bounds fit the viewport, the background is scroll-locked, Escape closes it and focus returns to `View Aristache Portfolio`. Back-to-top remains absent before Experience's bottom, appears farther into Projects, and is suppressed by the consent banner and by the mobile menu after its exit animation. The first menu sample can still contain the exiting button, so presence alone during that animation is not a reliable visibility assertion.

Reduced motion was checked by scrolling down and up at 375 x 812 and 1440 x 900. No horizontal overflow or broken loaded project covers appeared; desktop had zero `.pin-spacer` elements. These are browser emulation checks, not physical-device validation or a frame-by-frame motion audit.

### Remaining findings

- The initial consent overlap found during migration review was subsequently fixed at the owner's request. See the consent overlap follow-up below for the new verification results.
- Landscape Chrome reports that `/media/hero-960.webp` was preloaded but not used within a few seconds. No runtime error accompanied this warning.
- Group selection with real data, admin Save/revalidation, physical devices and production performance budgets remain unverified. No content was changed to manufacture a grouped example.

The local test browser's analytics preference was backed up and restored after the first-visit banner checks.

## Consent overlap fix follow-up

Hero now consumes the existing measured consent inset. Desktop raises the scroll cue above the panel. Portrait uses a higher content start and a horizontal 44px scroll cue. Short landscape puts social links in the spare space beside the text, with a dark backing for contrast, and keeps the cue clear of both the panel and the video control. These styles apply while the initial panel is present, with a pre-paint fallback; after choosing consent the measured reservation and special placement are cleared without a reload. Existing content and background media were not edited.

| Viewport | Social links intersect banner | Scroll cue intersects banner | CTA intersects banner | Page overflow |
| --- | --- | --- | --- | --- |
| 1440 x 900 | No | No | No | None |
| 1024 x 768 | No | No | No | None |
| 390 x 844, touch | No | No | No | None |
| 375 x 812, touch | No | No | No | None |
| 812 x 375, touch landscape | No | No | No | None |

The five sizes were rechecked on localhost:4000 with the initial prompt visible. Portrait and landscape were visually inspected. Landscape scrolling down and up through Hero produced no social-link or cue intersections with the banner. Reduced-motion checks at 375 x 812, 812 x 375 and 1440 x 900 also produced no intersections. Rejecting through the UI cleared the panel and restored normal landscape social positioning in the same page. The test browser's original preference was restored afterwards. Physical devices remain unverified.

The latest full gate passed: lint, Prettier, CSpell, TypeScript and 790 tests across 93 files. The two existing lint warnings in `scripts/poster-script-gate.js` remain. The added Hero test verifies reservation updates, consent resolution and cleanup. No database content, commit, push or Phase 1 work was performed.

## Earlier Privacy-route evidence

The existing `/privacy` route works and uses the changed consent panel, navigation and back-to-top components. The served consent stylesheet was checked for the new compact rules.

| Emulated viewport | Initial consent panel height | Minimum action height | Horizontal page overflow |
| --- | --- | --- | --- |
| 1440 x 900 | 61.6px | 44px | None |
| 1024 x 768 | 61.6px | 44px | None |
| 390 x 844, touch | 99.6px | 44px | None |
| 375 x 812, touch | 116.6px | 44px | None |
| 812 x 375, touch landscape | 53.6px | 44px | None |

Verified on Privacy: Preferences expands the panel and exposes its toggle; Escape returns to the compact prompt; Reject dismisses the prompt; back-to-top appears at scroll position 800 with no banner; opening the mobile menu hides it and Escape closes the menu. Reduced-motion emulation was checked at 375 x 812 with no horizontal overflow. Consent was rejected in this local test browser. These are browser emulation checks, not physical-device checks or proof that the homepage has no overlap.

## Source and automated coverage

Final gate passed on 2026-11-05: lint (two pre-existing warnings, no errors), Prettier check, CSpell, TypeScript and all 789 tests across 93 files. Vitest ran with four workers and the workspace temporary directory described below. `git diff --check` also passed.

- Card descriptions use the short tagline independently of full Quick View prose, with a word-boundary fallback limited to 140 characters including the ellipsis.
- Grouping covers hidden members, deterministic representation, featured aggregation, latest activity, Live ordering and ungrouped projects. Group membership stays in individual records.
- Component selection updates Quick View content, links and gallery; the gallery resets, selector focus stays in place and reopening starts at the representative. Gallery keyboard navigation does not capture selector arrow keys.
- Covers have no active image source before the section's one-viewport observer threshold, with a native no-JavaScript fallback. The first featured image is eager only after activation. Resize updates the observer margin.
- H1 tests check unique DOM text, including a single-word name. Back-to-top tests cover the Experience threshold, earlier-section fallbacks, resize, banner and menu suppression.

Vitest's default temporary cache path failed sandbox rename operations. Validation uses `.next/phase0-temp` for `TEMP` and `TMP`; this is an execution setting, not a project configuration change. ESLint reports two existing unused-variable warnings in `scripts/poster-script-gate.js`.

## Remaining manual content review

1. In admin, assign the three MituGym rows to one group and give App the lowest order. Check normalization on Save, immediate homepage revalidation and the dirty Save state. Clear a member's group and toggle Hidden to check both reversibility and exclusion.
2. Review the proposed copy in `phase-0-content-proposals.md` against the current inventory. Confirm every factual claim before publishing. Do not publish review notes as project copy.
3. At all five viewports above, review Hero's single-text sheen, the two featured slots, compact descriptions, component sub-links and the Quick View selector with keyboard and touch. Check closing animations and focus restoration to the opener.
4. Scroll the homepage fully down and up, expand Experience and rotate the viewport. Confirm back-to-top starts after Experience and stays clear of safe areas. Repeat with Experience hidden and with banner/menu open.
5. With an empty browser cache, inspect network requests before Projects approaches and after it enters the one-viewport margin. Check that cover images are absent before activation and component galleries load only on opening Quick View.
6. Repeat with reduced motion and JavaScript disabled. Confirm content remains readable, no duplicate H1 name, and fallback covers are available. Physical iPhone and Android checks remain outstanding.

No production performance measurement or build was performed in Phase 0. Stop here for review; Phase 1 requires the owner's instruction to continue.
