# Phase 0 content proposals

Drafts for editorial review, not applied to the database. English is the proposed public language.

## Evidence and review boundary

The connected database could not be read on 2026-11-05 because its Neon hostname failed DNS resolution in this execution environment. The inventory below comes from `src/db/seed.ts`, not a confirmed export of current admin data. Seed content is a starting point, not evidence of shipped features. Reconcile this list with admin before saving; additional live projects need the same review. Every Problem, Solution, Outcome and Role below is proposed copy requiring owner confirmation. No client results or adoption figures are asserted.

Keep confirmation instructions out of published copy: resolve them or remove the unverified claim before saving. Do not change README files or seed data to publish these drafts.

## Hero

- Headline: Infrastructure, web and mobile development.
- Summary: I keep enterprise systems running and build the web and mobile products that support everyday work.
- Tagline: From the server room to the screen.
- Evidence line, only after confirmation: 8+ years in IT, infrastructure and application development.
- Do not publish the proposed 1,600+ locations figure until its scope and source are confirmed.
- Replace or remove the generic quote through its owning admin field. If there is no matching field, leave the quote unchanged in Phase 0 and address that content control in the Hero phase.

## Editorial selection and grouping

Keep two featured cards: MituGym Ecosystem first, FitPro Center second. Reserve Car Detailing for the third featured position in Phase 7. Move the portfolio out of featured selection; its actual placement within Latest or More projects also depends on activity and list limits.

For the three MituGym records, set `group` to `mitugym`. Give App the lowest `order`, followed by Scanner and Web Panel. App supplies the group card title and cover, so the proposed App title is MituGym Ecosystem. The selector uses each record's editable title; the first option will consequently read MituGym Ecosystem, with the other two labelled MituGym Scanner and MituGym Web Panel. Existing galleries remain per component. Review any ecosystem-level App copy against the App-specific gallery before saving.

The group renders once, exposes repository links for its components and shows a component selector in Quick View. Clearing the group returns a record to an individual card. Hiding a member removes it from the public group. No records are deleted or merged in storage.

## Project drafts

### Aristache Portfolio

- Repository: `portfolio-nextjs`
- Proposed title: Aristache Portfolio
- Tagline (89 characters): A portfolio with a complete admin area, project case studies and privacy-aware analytics.
- Problem: Keep a growing portfolio current without editing source code for every content change.
- Solution: Connect a Next.js frontend to a database-backed admin area with immediate content revalidation.
- Outcome: Profile, project and section content can be managed through the admin interface.
- Role: Web development; confirm design, infrastructure and maintenance responsibilities.

### FitPro Center

- Repository: `fitpro-center`
- Proposed title: FitPro Center
- Tagline (81 characters): A fitness website that introduces the brand and helps visitors explore its offer.
- Problem: Give prospective members a clear introduction to the fitness brand.
- Solution: Build a responsive marketing website around the brand and its offer.
- Outcome: A dedicated web presence for FitPro Center. Confirm booking or lead-generation features before mentioning them.
- Role: Web development; confirm whether branding, design and copy were also your responsibility.

### ViralCutter

- Repository: `ViralCutter`
- Proposed title: ViralCutter
- Tagline (71 characters): Turn long videos into short clips with an AI-assisted editing workflow.
- Problem: Preparing short clips from long recordings can involve repetitive manual work.
- Solution: Build an AI-assisted workflow for selecting and preparing short video clips.
- Outcome: A tool for creating short clips from longer videos. Confirm supported inputs, exports and release status.
- Role: Software development; confirm which AI integrations and editing stages you implemented.

### VUZA

- Repository: `VUZA-Free-AI-Video-Creator-and-Pinterest-Video-Scraper`
- Proposed title: VUZA
- Tagline (89 characters): Create AI videos with voiceover and subtitles, with tools for collecting source material.
- Problem: Video creation involves coordinating source material, narration and captions.
- Solution: Combine AI video creation, voiceover, subtitles and a Pinterest collection tool.
- Outcome: A combined video-creation toolkit. Confirm which features are complete and available to users.
- Role: Software development; confirm ownership of each integration and the product release status.

### MiVue Pro

- Repository: `MiVue-Pro`
- Proposed title: MiVue Pro
- Tagline (70 characters): A web and mobile experience for browsing and managing dashcam footage.
- Problem: Make dashcam footage easier to browse and manage across devices.
- Solution: Build a website and mobile application focused on dashcam footage.
- Outcome: A dedicated interface for dashcam media. Confirm supported cameras, connection methods and completed features.
- Role: Web and mobile development; confirm device integration and design responsibilities.

### MituGym Ecosystem

- Repository: `mitugym-app`
- Proposed title: MituGym Ecosystem
- Tagline (81 characters): A connected gym toolkit for members, reception check-in and staff administration.
- Problem: Connect the member experience with reception and staff workflows.
- Solution: Develop complementary member, scanner and web-panel applications as one ecosystem.
- Outcome: Three complementary applications support the gym workflow. Confirm shared data flows, deployment and active usage.
- Role: Cross-platform application development; confirm architecture, backend and operational responsibilities.

### MituGym Web Panel

- Repository: `mitugym-app-webpanel`
- Proposed title: MituGym Web Panel
- Tagline (53 characters): A staff dashboard for managing the MituGym ecosystem.
- Problem: Provide staff with a dedicated interface for day-to-day gym administration.
- Solution: Build an authenticated web dashboard with persistent data and staff actions.
- Outcome: A web interface for staff workflows. Confirm the exact management functions available in production.
- Role: Web application development; confirm backend, access-control and deployment responsibilities.

### MituGym Scanner

- Repository: `mitugym_scanner_flutter`
- Proposed title: MituGym Scanner
- Tagline (59 characters): A Windows QR scanner for gym member check-in and check-out.
- Problem: Give reception a focused interface for recording member arrivals and departures.
- Solution: Build a Flutter desktop application for QR-based check-in and check-out.
- Outcome: A dedicated Windows check-in tool. Confirm hardware compatibility and synchronization behavior.
- Role: Desktop application development; confirm scanner integration and data synchronization responsibilities.

### MindMuscle.AI

- Repository: `MindMuscle.AI`
- Proposed title: MindMuscle.AI
- Tagline (59 characters): An AI-assisted fitness coaching app with progress tracking.
- Problem: Bring fitness guidance and progress tracking into one mobile experience.
- Solution: Build a mobile application combining AI-assisted coaching and progress tracking.
- Outcome: A mobile interface for coaching and tracking. Confirm completed features, availability and the limits of AI guidance.
- Role: Mobile application development; confirm AI integration, backend and design responsibilities.

### MindMuscle Web

- Repository: `MindMuscleWeb`
- Proposed title: MindMuscle Web
- Tagline (72 characters): A web experience for AI-assisted fitness coaching and progress tracking.
- Problem: Make fitness coaching and progress information accessible in a browser.
- Solution: Build a web application for AI-assisted coaching and progress tracking.
- Outcome: A browser-based fitness interface. Confirm feature parity with the mobile app and current availability.
- Role: Web application development; confirm shared backend, AI integration and deployment responsibilities.

### Auto Translate

- Repository: `auto-translate`
- Proposed title: Auto Translate
- Tagline (55 characters): A desktop application for real-time speech translation.
- Problem: Reduce friction when following speech in another language.
- Solution: Build a desktop workflow for speech recognition and translation.
- Outcome: A desktop speech-translation tool. Confirm supported languages, latency, audio routing and offline behavior.
- Role: Desktop application development; confirm speech, translation and packaging responsibilities.

### Car Detailing

- Repository: `car-detailing`
- Proposed title: Car Detailing
- Tagline (60 characters): A focused website presenting premium car detailing services.
- Problem: Help visitors understand the detailing offer and find the next step.
- Solution: Build a responsive landing page around services and a luxury visual identity.
- Outcome: A dedicated presentation website. Confirm contact, booking and business usage before making stronger claims.
- Role: Web development; confirm visual design, branding and content responsibilities.

### Personal Trainer

- Repository: `personal-trainer`
- Proposed title: Personal Trainer
- Tagline (77 characters): A responsive website introducing a personal trainer and their coaching offer.
- Problem: Give prospective clients a clear introduction to a trainer and their services.
- Solution: Build a responsive website focused on the coaching offer.
- Outcome: A dedicated trainer website. Confirm contact, booking, testimonials and live availability.
- Role: Web development; confirm design, content and deployment responsibilities.

## Corrections requiring current admin review

- Laneory: use this spelling consistently in title and description. The audit references a Laneory project, but its repository is not in the seed inventory; confirm the exact record before editing. Do not rename MiVue Pro based only on the poster filename.
- FitPro: replace the incomplete description ending in "Built with..." with the reviewed tagline above. Keep stack details in the stack field.
- Portfolio: remove internal implementation commentary such as "The site at https://www.aristache.dev is dark, with a single brand" from public card copy by saving the reviewed tagline. Full README prose remains available in Quick View; edit its owning source separately if that prose also needs correction.
- A Live label currently means a published URL is available. It does not establish product maturity, active users or production deployment. Confirm URLs in admin.
