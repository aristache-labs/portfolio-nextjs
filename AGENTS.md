# AI Agent Guidelines

Last updated: 2026-10-24

The working-discipline and multi-agent-safety rules that used to live here were a verbatim copy of `~/.claude/CLAUDE.md`, which is already loaded into every session. They were deleted rather than maintained in two places. This file now carries only what is true of **this repo** and cannot be derived from reading it quickly.

---

## Project

Personal portfolio and site for Cristache Adrian (https://github.com/aristache-labs). A database-driven Next.js app: every section of the homepage is content managed through an authenticated admin area rather than hardcoded.

| Area          | Detail                                                        |
| ------------- | ------------------------------------------------------------- |
| Runtime       | Bun (lockfile `bun.lockb`), TypeScript, ESM                   |
| Framework     | Next.js 16 (App Router) + React 19                            |
| Styling       | Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`) |
| Data          | Drizzle ORM + Postgres; migrations in `drizzle/`              |
| Auth          | NextAuth v5 (beta), admin-only                                |
| Platform      | Vercel - Blob (uploads), hosting                        |
| Email         | Resend (testimonial notifications)                            |
| Lint / format | ESLint + Prettier - double quotes, semicolons, 100 columns    |
| Tests         | Vitest (unit/component) + Playwright (e2e in `e2e/`)          |

### Layout

```
src/app/                 App Router routes
src/app/admin/           authenticated CRUD for every content type
src/app/api/             route handlers (upload, revalidate, testimonials, auth)
src/app/globals.css      the entire design system - read the notes inside before editing
src/components/home/     homepage sections (Hero, About, Projects, ...)
src/components/ui/       primitives (Button, Card, Section, dialog, avatar)
src/components/admin/    admin shell + the generic CRUD page/form machinery
src/db/schema.ts         Drizzle schema, single source of truth for content types
src/db/seed.ts           `bun run db:seed`
src/lib/queries.ts       the homepage's data reads
src/lib/projects.ts      merges DB curation rows with cached GitHub stats
src/lib/github-cache.ts  24h-TTL GitHub cache, never throws
src/lib/seo/site.ts      SITE constants (canonical URL, title, description)
scripts/                 check-routes and check-vitals
```

## Things that will bite you

1. **The build is `next build --webpack`, not Turbopack, and that is deliberate.** `sharp` is a native addon used server-side for image optimisation; Turbopack rewrites it into a hashed external module Vercel cannot `dlopen`. `next.config.js` also marks it in `serverExternalPackages`. Do not "modernise" the build script - see commits `9e79c27` and `fc7bb71`, which exist because this was broken in production twice. `bun run dev` still uses Turbopack, which is fine.

2. **The homepage is ISR-prerendered at build time, so a build needs a reachable, migrated, seeded database.** `src/app/page.tsx` queries Postgres during prerender. This is why CI stands up a Postgres service and runs `drizzle-kit migrate` + `db:seed` **before** `bun run build`, and why a build with no `DATABASE_URL` fails in a way that looks unrelated to the database.

   **`revalidate = 43200` (12h) is a cost decision, not a freshness one.** Neon bills wall-clock time the compute endpoint is _awake_, and any query wakes it for the whole auto-suspend window, so a short window never lets it sleep: at `revalidate = 60` the endpoint stays up ~730 h/month against a 100 h budget shared across every project. Content freshness does not depend on this timer at all - all ~30 mutations in `src/app/admin/actions.ts` call `revalidatePortfolio()`, which publishes immediately. The timer exists only so the 24h GitHub cache TTL is noticed on schedule, and 12h makes the real refresh interval land on 24h rather than the ~25h a 1h window produced. Raising it is nearly free; lowering it is not.

3. **Do not add unlayered CSS resets to `globals.css`.** An unlayered rule (`* { margin: 0 }`, `a { color: inherit }`, `button { background: transparent }`) beats every Tailwind utility regardless of specificity, because unlayered CSS outranks layered utilities. This has silently broken app-wide spacing and button text colours before. Tailwind v4 Preflight already resets correctly inside its layer. The file carries long comments saying this at each site - read them before touching it.

4. **The `@theme` -> `:root` indirection in `globals.css` is load-bearing.** Tailwind v4 only generates opacity modifiers (`/40`, `/[0.02]`) for colours registered as `--color-*` in `@theme`. So `@theme` declares `--color-surface: var(--surface)` and the raw value lives in `:root`. Swapping colour _values_ is safe; restructuring this pattern silently kills every `border-(--brand-deep)/40` in the codebase.

   The default palette lives in **`src/lib/brand.ts`**, the build-time source of truth. `globals.css` mirrors it by hand because CSS cannot import TypeScript, and `src/app/globals.theme.test.ts` derives its expectations from `brand.ts` to assert the mirror still holds - so a colour change fails the suite until both are updated. Token names are hue-neutral (`deep`/`mid`/`bright`) because the old `violet`/`cyan`/`pink` names stopped being true at the Glacier rebrand and would be wrong again on any future palette.

5. **There is one theme, Obsidian dark, on every route, with no switch at runtime.** The palette picker, `next-themes` and the light values are gone: `:root` in `globals.css` holds the only token set and sets `color-scheme: dark`, and `layout.tsx` puts a static `dark` class on `<html>` so `dark:` utilities keep applying. Do not reintroduce a `.dark` override block or a theme provider; the theme test fails on both. Colour consumers come in two kinds:

   - **`brand.ts` constants** where CSS cannot reach: `opengraph-image.tsx` (Satori at the edge), `manifest.ts` (JSON), `notify.ts` (email HTML, where custom properties are unsupported), the Quick View repo badges (Shields URLs) and `AmbientBackground.tsx` (a canvas cannot inherit a variable).
   - **CSS variables** for DOM chrome: Tailwind classes and `Logo.tsx` (SVG `stop-color` resolves `var()`).

   Decorative glows must use the `--brand-*-rgb` channel lists (`rgb(var(--brand-deep-rgb)/0.55)`) rather than literal `rgba()`, or a brand change silently skips them - five of them did exactly that, invisible to a hex search because they were written in decimal. The theme test asserts no `[data-palette]` block comes back.

6. **The status code of `/admin` depends on where the loading boundary sits.** `src/app/admin/layout.tsx` calls `redirect("/login")`. The loading screen now lives in `src/app/admin/loading.tsx`, below that layout, so nothing streams first and Next answers a real 307 to `/login`. While `loading.tsx` sat at the app root, the shell streamed before the redirect fired, so the same gate came back as a 200 carrying `NEXT_REDIRECT` plus a meta-refresh. Never assert the gate on the status code alone: a 200 is not "page works" and is not "unprotected". `scripts/check-routes.mjs` accepts either form of the redirect and asserts that no curated data reaches an anonymous request.

7. **Every homepage section is behind a `sectionVisibility` toggle** (`profile.sectionVisibility`, edited in `/admin/settings`). A hidden section runs no query and never loads its chunk. Never write a test or check that asserts on section copy like "Projects" - a legitimate admin action would fail it. Anchor on `SITE` in `src/lib/seo/site.ts` instead.

8. **Static metadata icons keep their extension.** `apple-icon.png` serves at `/apple-icon.png`; a bare `/apple-icon` is a 404. The App Router's apple-icon convention also rejects SVG, so this one must stay a PNG.

9. **`next dev --turbopack` does not hot-reload `globals.css`. Restart the dev server after editing it.** HMR silently keeps serving the previously compiled stylesheet, so a token change appears to do nothing and the obvious conclusion - that the CSS is wrong - is wrong. Verified by diffing the served `/_next/static/chunks/*.css` against the source: it still carried the old custom-property names minutes after the edit. To confirm a CSS change is actually live, grep the served stylesheet rather than trusting the page; "server responds 200" is not a readiness signal for CSS.

10. **The homepage and `/login` ship roughly ~762KB of JS** (decompressed, measured 2026-10-28), with an **800KB ceiling** in `check:vitals`. The shared root providers still dominate, with GA4 loaded only after explicit analytics consent (basic Consent Mode v2). Vercel Web Analytics is removed; Statsig, session replay and Speed Insights remain removed. The consent banner is dynamically imported, and no Google tag loads on admin or login routes. `AmbientBackgroundGate` keeps the canvas module off the homepage, login and admin routes; no custom cursor is mounted. Section background videos require a fine pointer, hover, at least 1024px width and no reduced-motion preference. The hero also plays its MP4 on touch devices in landscape; portrait phones and reduced-motion visitors keep static posters. Section videos use `preload="none"`, receive a source near the viewport, play only while visible and pause offscreen. Each backdrop has one poster image, without a duplicate `video.poster`; the hero also has one image across breakpoints. Below-the-fold homepage sections remain split with `next/dynamic`, so keep media loading and JavaScript payload regressions separate when investigating performance.

11. **Upload size is chosen per folder, and getting it wrong is invisible until someone looks.** `src/lib/blob.ts` has three entry points: `uploadIcon` fits inside **128px** (skill icons, SVG stored raw), `uploadAvatar` **1024px at quality 90**, `uploadProjectMedia` **1600x1000**. The profile portrait went through `uploadIcon` for a while, so it was stored at 128px and About upscaled it roughly 5x - it looked "dull and blurry" with nothing failing anywhere. `src/lib/__tests__/blob-avatar.test.ts` pins the boxes. Note also that a quality other than 75 must be listed in `images.qualities` in `next.config.js`; Next 16 allowlists it and rejects anything else with a 400 from the optimiser.

12. **Admin forms gate Save on being dirty, and the avatar does not wait for Save at all.** `src/components/admin/SubmitButton.tsx` finds its own form through the button's `form` property and compares a serialised `FormData` snapshot, so any form gets this by using that button - there is no provider. Fields that write a hidden input from React state change the DOM value with **no native event**, so the uploaders dispatch a bubbling `input` via `src/hooks/useAnnounceValue.ts` or an image-only edit leaves Save disabled. `AvatarField` deliberately does not announce, and submits no field at all: it is the sole writer of `profile.avatarUrl`, committing through `setProfileAvatar` on upload. The profile form omits the key entirely, which zod drops as an absent optional so Drizzle leaves the column alone - that is what stops a Save fired mid-upload from writing back the previous URL. An admin can paste any URL, so the action also rejects hosts `next/image` cannot serve (`src/lib/image-hosts.ts`, pinned to `next.config.js` by its own test); without that a saved avatar renders in the `unoptimized` admin preview while the public page shows nothing.

## Changing the brand colours

Edit `src/lib/brand.ts`, then its hand-written mirrors in `globals.css`: the `@theme` ramp and `:root`. `bun run test` fails until `globals.theme.test.ts` sees them agree. `src/app/icon.png` and `src/app/apple-icon.png` are the official monogram on a dark tile, so a colour change does not recolor them.

## Commands

```bash
bun run dev          # Turbopack dev server on port 4000
bun run db:seed      # seed the database
bun run db:studio    # inspect it
```

The gate, run by CI and `.githooks/pre-push` (enable once per clone with `git config core.hooksPath .githooks`):

```bash
bun run lint && bun run format:check && bun run check:spell && bun run typecheck && bun run test
```

Plus, in CI only, `bun run build` and two checks that need a running server:

```bash
bun run build && bun run start
bun run check:routes    # asserts every route serves the right CONTENT, not a 200
bun run check:vitals    # per-route JS payload and TTFB budgets
```

`check:vitals` refuses to measure a dev server or a different site on the port, because both produce believable-but-wrong numbers - a dev server serves unminified bundles. Point `BASE_URL` at a production build. `bun run build` is deliberately **not** in the pre-push hook: it is a webpack build that also needs a live seeded database, and a minute-plus gate teaches people to reach for `--no-verify`.

## Conventions

- Prettier owns formatting - double quotes, semicolons, trailing commas, 100-column lines, 2-space indent. Do not hand-format; run `bun run format`.
- Conventional Commits per the repo's own `.gitmessage`, which is authoritative: imperative subject `<=` 50 chars, no trailing period, body bullets starting `- ` wrapped at 72. It says explicitly **never** to add `Generated with Claude Code`, `Co-Authored-By`, or author trailers, and no commit in this repo's history has one. `.claude/settings.json` sets `includeCoAuthoredBy: false` to match.
- **Never use em-dashes.** Use a hyphen instead. This applies to code comments, commit messages, and prose.
- Markdown prose is never hard-wrapped: one line per paragraph and per list item. Do not re-wrap these files to a column.
- New words go in `cspell.json`, which the gate checks over `src/`, `scripts/` and root markdown. **`src/db/seed.ts` is excluded on purpose**: it is sample content, so its testimonial authors and employer names churn freely, and listing them turned the dictionary into a registry of throwaway data. Do not add seed-only names back - change the seed instead. Names that are part of the site's real identity (`Cristache`, `Adrian`, `aristache`, all in `src/lib/seo/site.ts` and elsewhere) do belong in the dictionary.
- The PR title becomes the squash commit message. `master` is protected: PR required, squash-only merges, admins may self-merge.

## Versioning and release

Every PR must bump `version` in `package.json`. `version-check.yml` enforces it as the required check **`package.json version bumped`**. On merge to `master`, `release.yml` reads that version and creates tag `v<version>` plus a GitHub Release, skipping idempotently if the tag already exists. There is no manual tagging step.

## Content model

`src/db/schema.ts` is the source of truth. Adding a content type means: a table, a migration (`bun run db:generate`), an admin page under `src/app/admin/` (the `AdminCrudPage` + `AdminField` machinery covers text, textarea, number, url, select, checkbox and image fields), server actions in `src/app/admin/actions.ts`, a read in `src/lib/queries.ts`, and a `revalidatePortfolio()` call so the ISR homepage picks it up. Image fields upload to Vercel Blob through `src/app/api/admin/upload`.
