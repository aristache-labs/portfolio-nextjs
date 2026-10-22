# iPhone layout verification

## Current evidence

The local page delivers one viewport declaration: `width=device-width, initial-scale=1, viewport-fit=cover`. Before the change, desktop Chromium and WebKit with touch and mobile emulation at 932 by 430 CSS pixels measured the document, homepage wrapper, hero, and hero background at left 0 and width 932. The root font was 11px in both engines, matching the existing compact landscape rule. This does not reproduce the side bands in the Chrome screenshot or establish whether Chrome reserves space outside its document viewport.

Portrait hero content now uses explicit spacing rather than vertical centering within the large viewport height. The section retains a portrait-only `100lvh` minimum so the next section starts below the first screen even when Safari exposes more space than Chrome. Device captures report a 932px screen but different large viewport heights: about 815px in Safari and 853px in Chrome. On a coarse-pointer portrait phone, the minimum also includes `screen.height` as a conservative floor because Safari paints content below its reported viewport. This can add scrolling; it avoids browser-specific toolbar offsets. Its scroll cue participates in normal flow immediately below the content. The section can grow when content needs more room. Landscape keeps the existing compact scale and safe-area padding. Backgrounds remain outside the padded content containers. There is no browser-specific width compensation.

## Automated checks

Run `bunx playwright install chromium webkit`, then `bun run test:e2e --project=mobile-chromium --project=mobile-webkit`. These projects check portrait, landscape, height changes, rotation by resizing, and reload. The report includes viewport dimensions, scale, safe-area values, root font size, and page/background bounds. Emulation does not reproduce iPhone browser toolbars or physical screen safe areas.

## Required device checks

- Use the same complete URL, including port, in both browsers on the same iPhone. Record iOS and browser versions. Set page zoom to 100%, use the same content, and wait for fonts and entrance animations.
- Test portrait, both landscape directions, rotation without reload, and direct reload in landscape. Repeat with browser controls expanded and collapsed.
- Inspect the delivered viewport tag and confirm the served stylesheet matches the source. Restart the development server after editing global CSS.
- Through a device inspector, record `innerWidth`, `innerHeight`, `visualViewport.width`, `visualViewport.height`, `visualViewport.offsetLeft`, `visualViewport.scale`, and `document.documentElement.clientWidth`. Measure `getBoundingClientRect()` for `html`, `body`, `[data-site]`, `#hero`, and `#hero > div:first-child`. Measure the four `env(safe-area-inset-*)` values using padding on a temporary element.
- If all five elements fill the exposed viewport but bands remain beyond it, investigate browser-owned insets using the recorded versions. Page CSS cannot paint outside the viewport the browser exposes. If an element is narrower, identify its containing block before changing widths.
- Accept when backgrounds fill the available document viewport, controls clear the notch and screen edges, no horizontal scrolling occurs, portrait spacing stays stable as controls move, and content remains usable with pinch zoom. Different browser toolbar appearance and video frames are expected.

Real iPhone verification remains required before declaring Chrome's side bands resolved.
