---
name: verify-section-navigation
description: Use this skill when fixing or verifying portfolio section links, refresh restoration, or navigation between Privacy/GDPR and the homepage, especially duplicated fragments such as #contact#skills. Reproduce on the production build because the development server can hide the failure.
---

# Verify portfolio section navigation

**Failure pattern:** Next 16.2 can cache the homepage's initial canonical URL with its fragment, then append a new fragment when returning from another route.

**Verified by:** On 2026-10-28, the production regression reproduced `/#contact#skills` at desktop and 390px widths before the fix. After rebuilding with `SectionLink`, all nine navigation tests passed across the desktop, portrait, and landscape production projects. The spec uses each project's own viewport settings.

## Procedure

1. Inspect `src/components/common/SectionLink.tsx`, its consumers in `src/components/navbar/SiteNav.tsx` and `src/components/layout/Footer.tsx`, and `src/components/util/HashScrollFix.tsx` before changing section navigation.
2. Build with `bun run build`. The repo deliberately uses webpack. The build needs a reachable, migrated, seeded Postgres database; local configuration is in `.env.local`. Refer to `DATABASE_URL` by name and never copy its value into notes or skills.
3. Run `bunx playwright test --config=playwright.production.config.ts e2e/section-navigation.spec.ts --workers=1 --reporter=line` after the build completes. The production config starts port 4100. Ensure any reused server belongs to the newly built version. The default development config deliberately excludes this spec.
4. Require the manual-scroll regression: open `/`, click Get in Touch, scroll manually to the top while `#contact` remains in the address, reload, navigate to Privacy, then choose Skills in the footer. Require exactly `/#skills` and the Skills section near the viewport top.
5. Also cover the Scroll to top button, reload, and returning through the GDPR navigation. Run the desktop, portrait, and landscape production projects; do not replace mobile settings with a desktop-only viewport approximation.
6. Run lint after Playwright finishes. Run relevant component tests and the repository gate, reporting any unrelated failures separately.

## Implementation facts

- `SectionLink` renders a native anchor for cross-page section navigation and Next `Link` for same-page navigation. The full document navigation avoids the cached canonical URL; preserve native modified-click and keyboard behavior.
- In the installed Next 16.2 code, `client/components/router-reducer/create-initial-router-state.js` seeds the canonical URL from the browser location. `client/components/segment-cache/navigation.js` appends `url.hash` to `route.canonicalUrl`. Inspect installed code again after framework upgrades before retaining this workaround indefinitely.
- `scroll-to-section.ts` uses the public `history.replaceState(null, "", url)` integration. Passing `window.history.state` back includes Next's internal marker and bypasses router synchronization.
- `ScrollToTop` clears the hash. Manual scrolling intentionally leaves it intact, so clearing only from that button cannot prevent the reload failure.
- `HashScrollFix` skips initial reload alignment so the browser can restore the reader's position. A viewport at the hero with `#contact` in the URL is therefore a valid regression setup.

## What didn't work

- Development-server navigation tests passed while the production build still produced `/#contact#skills`. Development success does not verify this fix.
- Clearing the fragment only in Scroll to top and synchronizing custom section scrolling fixed the button sequence but missed manual scrolling followed by refresh.
- Running `eslint .` while Playwright recreated `test-results` caused an `ENOENT` directory scan failure. Keep those operations sequential.
- A full unit run under concurrent build/browser load timed out in `ProjectsBrowser`; its 17 tests passed when rerun alone. Investigate failures before changing unrelated code or increasing timeouts.
