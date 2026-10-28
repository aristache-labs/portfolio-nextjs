# Aristache portfolio video

Creates a real recording of https://www.aristache.dev/ in desktop and mobile layouts.

## Windows setup

Install Node.js LTS and FFmpeg (with ffmpeg available on PATH). Open PowerShell in this extracted folder, then run:

```powershell
npm init -y
npm install playwright
npx playwright install chromium
node .\scripts\record-portfolio.mjs
```

If FFmpeg is not on PATH, supply its full executable path before running:

```powershell
$env:FFMPEG_PATH = 'C:\ffmpeg\bin\ffmpeg.exe'
node .\scripts\record-portfolio.mjs
```

## Outputs

Each run writes to `screenshots/video` (replacing the previous outputs):

- `aristache-presentation.mp4`: approximately 56 seconds, 1920 x 1080, desktop first, then a centered mobile view on an obsidian background, with short fades.
- `desktop.mp4`: approximately 26 seconds, 1920 x 880.
- `mobile.mp4`: approximately 30 seconds, 432 x 760.
- Raw WebM recordings, including initial loading, for recovery or editing.

Each finished pass holds the hero for two seconds, scrolls from top to bottom, and holds the footer for two seconds. Only initial loading is trimmed out. There is no preliminary scroll: sections are visited for the first time during the recording so one-time entrance animations remain visible. Lazy media loads as the page scrolls. Both layouts use dark browser color preference and preserve the live site's background videos and animations. No sound or music is added.

## Adjustments

For a slower presentation with more time to see projects:

```powershell
$env:SCROLL_MULTIPLIER = '1.5'
node .\scripts\record-portfolio.mjs
```

Use a local development server instead:

```powershell
$env:PORTFOLIO_URL = 'http://localhost:4000'
node .\scripts\record-portfolio.mjs
```

Optional installed Chrome fallback:

```powershell
$env:CHROME_CHANNEL = 'chrome'
node .\scripts\record-portfolio.mjs
```

Edit the 22 and 26 second scroll durations in the script to set separate desktop/mobile speeds. A full mobile page contains more vertical content, so increase its duration if text moves too quickly.

## Validation and limits

The JavaScript syntax and video composition were checked. The live recording has not been run in this environment, which lacks the required recording controls. Run locally and review the result before publishing. Playwright's recorder does not guarantee 30 unique captured frames per second; the MP4 export normalizes to 30 fps without interpolation. Encoding uses the veryfast preset to reduce export time. Loading trim uses an approximate page-creation timestamp: if the beginning needs a small adjustment, the complete raw recordings are retained. Cloud/network loading, consent banners, hardware speed, and browser autoplay behavior can affect the result. The script does not dismiss dialogs or modify the deployed website. If you encounter a banner, handle it in your own capture setup before publishing.

Playwright recording documentation: https://playwright.dev/docs/videos

## Scroll animation capture

The recorder suppresses `scrollend` in its own browser context: repeated scripted scroll updates can otherwise activate the site's skipped-content fallback before entrance animations start. Intersection observers and entrance animations remain enabled. This does not change the deployed website.

The default scroll multiplier is 1: 22 seconds of scrolling on desktop and 26 seconds on mobile, plus the opening and closing holds. Compared with the previous default of 1.5, scrolling takes one third less time. Exports use 30 fps without motion interpolation and the veryfast encoding preset. `SMOOTH_VIDEO` is no longer used.

If a previous PowerShell session still has a slower multiplier set, reset it before recording:

```powershell
$env:SCROLL_MULTIPLIER = '1'
node .\scripts\record-portfolio.mjs
```

## Visible browser area

Desktop uses a 1920 x 1080 screen with a 1920 x 880 webpage viewport. Mobile uses a 432 x 864 screen with a 432 x 760 webpage viewport. The difference approximates space occupied by browser and system controls; those controls are not drawn in the recording. The combined presentation keeps a 1920 x 1080 canvas and preserves each recording's aspect ratio with padding.

For an exact match to your browser, read `window.innerHeight` in its developer console at 100% zoom and set the corresponding height (use an even number):

```powershell
$env:DESKTOP_VIEWPORT_HEIGHT = '880'
$env:MOBILE_VIEWPORT_HEIGHT = '760'
node .\scripts\record-portfolio.mjs
```
