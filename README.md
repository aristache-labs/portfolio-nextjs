<div align="center">

<img src="https://raw.githubusercontent.com/aristache-labs/portfolio-nextjs/refs/heads/master/public/brand/logo.svg" width="76" alt="Adrian Cristache">

# Adrian Cristache · Portfolio

<em>IT Specialist · Web &amp; Mobile Developer. The site is edited in admin, not redeployed.</em>

<br />

<a href="https://www.aristache.dev">www.aristache.dev</a>

<br />

<img src="./public/brand/portfolio-nextjs-poster.webp" width="100%" alt="Aristache portfolio on laptop and phones">

<br />

![CI](https://shields.io/github/actions/workflow/status/aristache-labs/portfolio-nextjs/ci.yml?branch=master&style=flat-square&label=CI&labelColor=0f6e68)
![Lighthouse](https://shields.io/github/actions/workflow/status/aristache-labs/portfolio-nextjs/lighthouse.yml?style=flat-square&label=Lighthouse&labelColor=0f6e68)
![Stars](https://shields.io/github/stars/aristache-labs/portfolio-nextjs?style=flat-square&labelColor=0f6e68&color=76f5e1)
![Contributors](https://shields.io/github/contributors/aristache-labs/portfolio-nextjs?style=flat-square&labelColor=0f6e68&color=76f5e1)
![License: MIT](https://shields.io/github/license/aristache-labs/portfolio-nextjs?style=flat-square&labelColor=0f6e68&color=76f5e1)
![Last commit](https://shields.io/github/last-commit/aristache-labs/portfolio-nextjs?style=flat-square&labelColor=0f6e68&color=76f5e1)
![Issues](https://shields.io/github/issues/aristache-labs/portfolio-nextjs?style=flat-square&labelColor=0f6e68&color=76f5e1)
![Watchers](https://shields.io/github/watchers/aristache-labs/portfolio-nextjs?style=flat-square&labelColor=0f6e68&color=76f5e1)

<strong>Dark only &middot; one brand &middot; every section DB-driven &middot; GitHub OAuth admin &middot; ISR with on-demand revalidation</strong><br>
<sub>Live at <a href="https://www.aristache.dev">www.aristache.dev</a>. What is checkable: Vitest unit tests plus Playwright end-to-end tests; a route check that asserts every page serves the <em>right content</em> rather than a 200, which is the only way to test an <a href="https://github.com/aristache-labs/portfolio-nextjs/blob/master/scripts/check-routes.mjs">admin route that is protected <em>and</em> returns 200</a>; per-route JS payload and TTFB budgets measured against a production build, which <a href="https://github.com/aristache-labs/portfolio-nextjs/blob/master/scripts/check-vitals.mjs">refuse to measure a dev server</a> because unminified bundles read several times heavier; and Lighthouse gating <strong>accessibility, best practices and SEO at &ge; 0.90</strong> on every pull request. <a href="https://github.com/aristache-labs/portfolio-nextjs/actions/workflows/ci.yml">See the runs</a>.</sub>

<br />

[Stack](#stack) &middot; [The site](#the-site) &middot; [Local setup](#local-setup) &middot; [Admin panel](#admin-panel) &middot; [Deployment](#deployment)

<sub><b>AI agents / LLMs:</b> the deployed site is machine-readable at <code>/llms.txt</code>, or as one blob at <code>/llms-full.txt</code>. Repo conventions and pitfalls live in <a href="AGENTS.md"><code>AGENTS.md</code></a>.</sub>

</div>

---

## Overview

Aristache is the personal portfolio of Adrian Cristache: IT Specialist · Web & Mobile Developer. The site at https://www.aristache.dev is dark, with a single brand. Profile, projects, experience, skills, services, and contact details are stored in PostgreSQL and edited from the admin panel, so a content change publishes without a redeploy. Featured work opens in a quick view with screenshots and live GitHub stats.

## Table of Contents

- [Adrian Cristache · Portfolio](#adrian-cristache--portfolio)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Stack](#stack)
  - [The site](#the-site)
  - [Architecture overview](#architecture-overview)
  - [Prerequisites](#prerequisites)
  - [Local setup](#local-setup)
    - [1. Clone and install](#1-clone-and-install)
    - [2. Environment variables](#2-environment-variables)
    - [3. Database setup](#3-database-setup)
    - [4. Git hooks](#4-git-hooks)
    - [5. Run the dev server](#5-run-the-dev-server)
  - [Commands](#commands)
  - [Admin panel](#admin-panel)
  - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [Contributors](#contributors)
  - [License](#license)
  - [Support the project](#support-the-project)
  - [Connect](#connect)

---

## Stack

| Layer           | Technology                                                          |
| --------------- | ------------------------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org/) (App Router, Turbopack in dev)    |
| UI library      | [React 19](https://react.dev/)                                      |
| Language        | TypeScript                                                          |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/), Geist, Sora, Caveat    |
| Animation       | [Framer Motion](https://www.framer-motion.com/)                     |
| Icons           | [Lucide React](https://lucide.dev/)                                 |
| Database        | PostgreSQL via [postgres-js](https://github.com/porsager/postgres)  |
| ORM             | [Drizzle ORM](https://orm.drizzle.team/)                            |
| Auth            | [Auth.js v5](https://authjs.dev/) - GitHub OAuth                    |
| File storage    | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)          |
| Email           | [Resend](https://resend.com/)                                       |
| Analytics       | [Vercel Analytics](https://vercel.com/analytics) |
| Package manager | [Bun](https://bun.sh/)                                              |
| Unit tests      | [Vitest](https://vitest.dev/) + Testing Library                     |
| E2E tests       | [Playwright](https://playwright.dev/)                               |
| Deployment      | [Vercel](https://vercel.com/)                                       |

---

## The site

[www.aristache.dev](https://www.aristache.dev) is a dark, single-palette portfolio. Visitors do not pick a light theme or a brand colour. The homepage is one scroll:

1. **Hero** - name, role marquee, "Currently" tagline, resume, socials.
2. **About** - bio, portrait, stats. Years of experience come from the experience rows, so the number moves on its own each January.
3. **Skills** - grouped cards with icons.
4. **Experience** - roles with expandable detail.
5. **Projects** - featured showcase, category filter, grid, and a quick view (cover, screenshots, stars, forks, GitHub and live links).
6. **Services** - what is on offer.
7. **Contact** - subject, message, email via Resend. An empty profile email hides the email card.

Each section can be hidden in admin. A hidden section runs no query and never loads its chunk. Nav and footer follow the same visibility map. A primary funding link can show as the sponsor in the nav.

---

## Architecture overview

- **DB-driven content** - profile, projects, experiences, skills, services, social links, and funding links live in PostgreSQL and are seeded with `bun run db:seed`. The admin panel is the editor. The profile drives the hero (name, roles, tagline, resume) and About (bio, avatar, stats).
- **Image uploads** - the profile avatar, skill icons, and project media (cover plus up to six quick-view screenshots) go from admin to Vercel Blob. Icons fit inside a 128px box, SVG stored raw. The avatar is 1024px. Project media fits inside 1600×1000. Every image field also accepts a plain URL.
- **GitHub cache** - stars, forks, languages, descriptions, and a README excerpt per repo, plus account-level followers, stars, and repo counts, are cached in Postgres with a **24-hour TTL**. A GitHub outage falls back to the last good row. Only repos listed in the database are enriched.
- **Look** - dark only, one brand (the default ramp in `src/lib/brand.ts`, mirrored in `globals.css`). Open Graph, the PWA manifest, and notification email use that same ramp. There is no light mode and no palette picker on the site.
- **Contact** - the form posts to `/api/contact`. Server validation checks the fields, a rate limit caps repeats, and Resend emails `CONTACT_EMAIL`.
- **Admin panel** - GitHub OAuth (`AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`). Only the login in `ADMIN_GITHUB_LOGIN` (this site: `aristache-labs`) can sign in. CRUD covers every content type above. Settings toggles section visibility.
- **SEO** - metadata, Open Graph, Twitter cards, JSON-LD, `robots.txt`, and `/llms.txt` come from the profile row and `src/lib/seo/site.ts`. The canonical origin is `NEXT_PUBLIC_SITE_URL` (`https://www.aristache.dev` in production).
- **Freshness** - the homepage is ISR (`revalidate = 43200`, 12h). That timer is a database compute budget, not how fast edits show up. Admin saves call `revalidatePortfolio()` and publish immediately.

---

## Prerequisites

- **[Bun](https://bun.sh/) ≥ 1.1** - the only supported package manager and runtime.
- **PostgreSQL ≥ 14** - running locally or via a managed service (Neon, Supabase, etc.).
- A **GitHub OAuth App** for admin login (Settings → Developer settings → OAuth Apps). Callback should match the site, `https://www.aristache.dev` in production and `http://localhost:4000` locally.

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/aristache-labs/portfolio-nextjs.git
cd portfolio-nextjs
bun install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable                                | Required    | Description                                                                                   |
| --------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                          | Yes         | PostgreSQL connection string, e.g. `postgres://user:pass@localhost:5432/portfolio`            |
| `AUTH_SECRET`                           | Yes         | Random secret for Auth.js session encryption (`openssl rand -base64 32`)                      |
| `AUTH_GITHUB_ID`                        | Yes         | GitHub OAuth App client ID                                                                    |
| `AUTH_GITHUB_SECRET`                    | Yes         | GitHub OAuth App client secret                                                                |
| `ADMIN_GITHUB_LOGIN`                    | Yes         | GitHub username allowed into admin. This site uses `aristache-labs`                           |
| `GITHUB_TOKEN`                          | Recommended | GitHub personal access token for project metadata (higher rate limits)                        |
| `BLOB_READ_WRITE_TOKEN`                 | Yes (prod)  | Vercel Blob token for avatar, skill icons, and project media                                  |
| `RESEND_API_KEY`                        | Yes (prod)  | Resend API key for contact notifications                                                      |
| `RESEND_FROM_EMAIL`                     | Yes (prod)  | From address, e.g. `Aristache <noreply@aristache.dev>` (verified domain)                      |
| `RESEND_CONTACT_TEMPLATE_ID`            | Yes (prod)  | Published Resend contact template ID or alias                                                  |
| `CONTACT_EMAIL`                         | Yes (prod)  | Inbox that receives contact-form mail                                                         |
| `REVALIDATE_SECRET`                     | Yes (prod)  | Secret for the `/api/revalidate` on-demand revalidation endpoint                              |
| `NEXT_PUBLIC_SITE_URL`                  | Yes         | Canonical site URL. Local: `http://localhost:4000`. Production: `https://www.aristache.dev`   |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION_TOKEN` | Optional    | Google Search Console site verification token                                                 |

> The resume link is stored in the database (`profile.resumeUrl`) and managed from the admin panel, not via an environment variable.

The contact template must be published in Resend and define four string variables: `CONTACT_NAME`, `CONTACT_EMAIL`, `CONTACT_SUBJECT`, and `CONTACT_MESSAGE`. Use triple braces such as `{{{CONTACT_NAME}}}` in its HTML. The route supplies the subject and sender, and sets the visitor's email as `replyTo`. Set `RESEND_CONTACT_TEMPLATE_ID` locally and in Vercel before deploying this integration.

### 3. Database setup

Run migrations to create the schema, then seed initial data:

```bash
bunx drizzle-kit migrate
bun run db:seed
```

### 4. Git hooks

Enable the pre-push lint + format gate once per clone:

```bash
git config core.hooksPath .githooks
```

This runs `bun run lint` and `bun run format:check` before every push. Bypass in an emergency with `git push --no-verify`.

### 5. Run the dev server

```bash
bun run dev
```

The site is available at [http://localhost:4000](http://localhost:4000).

---

## Commands

| Command                | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `bun run dev`          | Start dev server (Turbopack, port 4000)                          |
| `bun run build`        | Production build (**webpack**, see the note below)               |
| `bun run start`        | Start production server (port 3000)                              |
| `bun run lint`         | Run ESLint                                                       |
| `bun run lint:fix`     | Run ESLint with auto-fix                                         |
| `bun run format`       | Format source files with Prettier                                |
| `bun run format:check` | Check formatting without writing                                 |
| `bun run check:spell`  | Spell-check source, scripts and root markdown (cspell)           |
| `bun run typecheck`    | Run `tsc --noEmit`                                               |
| `bun run test`         | Run Vitest unit tests                                            |
| `bun run test:watch`   | Run Vitest in watch mode                                         |
| `bun run test:e2e`     | Run Playwright end-to-end tests                                  |
| `bun run check:routes` | Assert every route serves the right **content** (needs a server) |
| `bun run check:vitals` | Per-route JS payload and TTFB budgets (needs a server)           |
| `bun run db:generate`  | Generate a new Drizzle migration                                 |
| `bun run db:migrate`   | Apply pending migrations                                         |
| `bun run db:push`      | Push schema changes directly (dev only)                          |
| `bun run db:studio`    | Open Drizzle Studio                                              |
| `bun run db:seed`      | Seed the database with initial data                              |

> **The production build uses webpack, not Turbopack, on purpose.** `sharp` is a native addon used server-side for image optimization, and Turbopack rewrites it into a hashed external module that Vercel cannot load at runtime. `bun run dev` still uses Turbopack.

`check:routes` and `check:vitals` run against a running server, so build and start first:

```bash
bun run build && bun run start
bun run check:routes    # BASE_URL=http://localhost:4000 to check a dev server instead
bun run check:vitals    # refuses a dev server: unminified bundles give meaningless numbers
```

---

## Admin panel

The admin panel is at `/admin` and requires GitHub OAuth.

- Only `ADMIN_GITHUB_LOGIN` can sign in. For this site that is `aristache-labs`.
- Tabs: profile, projects, experiences, skills, services, social links, funding links, and settings.
- Profile: name, email, bio, hero roles, hero tagline, resume link, avatar (upload or URL).
- Projects: which repos appear, title, blurb, category, tags, order, featured and hidden flags, a cover, and up to six screenshots. `order` ranks the showcase. Leading featured rows get the large cells. The rest keep a Featured badge in the grid. `category` feeds the public filter. **Refresh** on a row pulls stars, forks, and the README `## Overview` immediately, instead of waiting for the 24-hour GitHub cache.
- Skills: name, category, level, icon upload or URL.
- Settings: per-section visibility. Hiding a section also skips its query and its JS chunk.
- Years of experience are derived from experience start years, not from the age of the GitHub account.

Image uploads need `BLOB_READ_WRITE_TOKEN`.

---

## Deployment

The site is deployed on [Vercel](https://vercel.com/) at [www.aristache.dev](https://www.aristache.dev). `master` deploys automatically.

1. Import [aristache-labs/portfolio-nextjs](https://github.com/aristache-labs/portfolio-nextjs) in Vercel.
2. Add all required environment variables in the Vercel project settings. Set `NEXT_PUBLIC_SITE_URL` to `https://www.aristache.dev`.
3. Provision PostgreSQL (Neon) and set `DATABASE_URL` to its **pooled** connection string.
4. Seed production **once**: `DATABASE_URL=<prod> bun run db:seed`. The seed inserts only when the database is empty and never overwrites later edits.
5. Push to `master`. Vercel runs `vercel-build`, which applies pending migrations and then builds. It does not seed. Further content changes happen in the admin panel.

The local `DATABASE_URL` stays on local Postgres. Only the Vercel environment uses the production database.

---

## Contributing

Contributions are welcome. Fork, branch, and open a PR. See [CONTRIBUTING.md](CONTRIBUTING.md) for the checks a PR has to pass. Bugs and ideas go to [Issues][issues]. Vulnerabilities follow [SECURITY.md](SECURITY.md).

Repo conventions, the local gate, and the pitfalls worth knowing before touching the design system live in [AGENTS.md](AGENTS.md).

## Contributors

Thanks to everyone who has contributed to this portfolio.

<a href="https://github.com/aristache-labs/portfolio-nextjs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=aristache-labs/portfolio-nextjs" alt="Contributors" />
</a>

## License

Licensed under the **MIT** license. See [LICENSE](LICENSE).

## Support the project

This portfolio is MIT licensed and free to fork. The live site is [www.aristache.dev](https://www.aristache.dev).

## Connect

<div align="center">

**Adrian Cristache** · [aristache.dev](https://www.aristache.dev)

<a href="https://github.com/aristache-labs"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
<a href="https://www.aristache.dev"><img src="https://img.shields.io/badge/Site-0f6e68?style=for-the-badge&logo=googlechrome&logoColor=white" alt="aristache.dev" /></a>

</div>

[ci]: https://github.com/aristache-labs/portfolio-nextjs/actions/workflows/ci.yml
[lighthouse]: https://github.com/aristache-labs/portfolio-nextjs/actions/workflows/lighthouse.yml
[repo]: https://github.com/aristache-labs/portfolio-nextjs
[issues]: https://github.com/aristache-labs/portfolio-nextjs/issues
[pulls]: https://github.com/aristache-labs/portfolio-nextjs/pulls
[contributors]: https://github.com/aristache-labs/portfolio-nextjs/graphs/contributors
[license]: https://github.com/aristache-labs/portfolio-nextjs/blob/master/LICENSE
