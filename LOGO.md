# Logo And Brand Replacement Handoff

Use this file on your personal laptop when you want to replace the current Learnova logo and related branding visuals.

## What Exists Right Now

The current frontend does not use one shared image logo file everywhere.

Instead, branding is currently built from:

- text like `Learnova`
- Lucide icons like `GraduationCap` and `BookOpen`
- brand gradients using blue / violet color combinations
- browser favicon in `client/public/favicon.svg`

That means a proper logo replacement needs changes in multiple places.

## Recommended New Files To Add

On your personal laptop, add these files first:

1. `client/src/assets/logo-wordmark.svg`
2. `client/src/assets/logo-mark.svg`
3. `client/public/favicon.svg`

Suggested use:

- `logo-wordmark.svg`: full logo with icon + brand name
- `logo-mark.svg`: compact square/icon version for small spaces
- `favicon.svg`: browser-tab icon version

If you only have one logo file, you can still use it everywhere, but it is usually better to keep separate full and compact versions.

## Must-Change Files

These are the main files to update if you want the visible logo changed across the site.

### 1. Main navbar logo

File:

- `client/src/components/Navbar.tsx`

Current behavior:

- uses a `GraduationCap` icon inside a gradient square
- shows `Learnova` text beside it

What to change:

- replace the icon block with your `logo-mark.svg` or `logo-wordmark.svg`
- optionally remove the gradient-text wordmark if your image already includes the brand name

## 2. Browser tab icon and title

File:

- `client/index.html`

Current behavior:

- favicon is loaded from `/favicon.svg`
- page title is `Learnova – Find Institutes & Tutors`

What to change:

- replace `client/public/favicon.svg` with your new favicon
- if you rename the favicon file, update the `href` in `client/index.html`
- update the `<title>` if your brand name changes
- update the meta description if you want the browser/search preview text refreshed too

## 3. Login page logo

File:

- `client/src/pages/Login.tsx`

Current behavior:

- desktop left panel uses `GraduationCap` + `Learnova`
- mobile top area uses a smaller icon + `Learnova`

What to change:

- replace both desktop and mobile logo blocks with your image logo
- if your full logo is wide, use the wordmark on desktop and the icon-only version on mobile

## 4. Register page logo

File:

- `client/src/pages/Register.tsx`

Current behavior:

- uses `GraduationCap` + `Learnova` in the registration header

What to change:

- replace that header block with your new logo

## 5. Terms page logo

File:

- `client/src/pages/Terms.tsx`

Current behavior:

- uses a small icon block plus `Learnova` text at the top

What to change:

- replace the icon and wordmark with your new compact logo

## 6. 404 page logo

File:

- `client/src/pages/NotFound.tsx`

Current behavior:

- uses the current icon block + `Learnova`

What to change:

- replace with your compact logo or small wordmark

## 7. Homepage footer logo

File:

- `client/src/pages/Home.tsx`

Current behavior:

- footer uses a `BookOpen` icon and `Learnova` text
- copyright line says `© 2026 Learnova. All rights reserved.`

What to change:

- replace the footer icon with your real logo mark
- change the text if your brand name changes
- update the copyright line if needed

## 8. Admin dashboard brand text

File:

- `client/src/pages/admin/AdminDashboard.tsx`

Current behavior:

- subtitle says `Learnova platform management`

What to change:

- update that text if you are renaming the brand

This is not the visual logo itself, but it is part of visible branding.

## Other Visible Brand Text To Review

These are not logo components, but they contain visible `Learnova` text and should be reviewed if you are doing a full brand rename.

### Homepage marketing copy

File:

- `client/src/pages/Home.tsx`

Examples there include:

- `Highest rated educational institutes on Learnova`
- `Why Learnova`
- `Join Learnova and reach thousands of students across India`

### Terms and privacy content

File:

- `client/src/pages/Terms.tsx`

This file contains multiple legal and descriptive references to `Learnova` inside the policy text.

### Login / auth / not found text blocks

Files:

- `client/src/pages/Login.tsx`
- `client/src/pages/NotFound.tsx`

These contain visible brand-name text alongside the logo blocks.

## Optional Brand Color Changes

If your new logo uses different colors, update these too.

### Global CSS variables

File:

- `client/src/index.css`

Current main tokens:

- `--brand-dark`
- `--brand-primary`
- `--brand-accent`
- `--brand-mist`
- `--brand-body`
- `--brand-secondary`
- `--brand-border`

### Tailwind brand tokens

File:

- `client/tailwind.config.js`

If you change the palette, keep this file in sync with `client/src/index.css`.

## Files You Usually Do Not Need To Change For Logo Only

Do not change these just for a logo swap:

- `client/src/api/axios.ts`
- `client/src/context/AuthContext.tsx`
- `client/src/constants/providerOnboarding.ts`

Reason:

- those `learnova_*` keys are storage identifiers, not visible user-facing branding
- changing them without a plan can break existing saved sessions or draft state

Only change them if you are doing a full technical rebrand and are okay with resetting browser storage behavior.

## Practical Replacement Plan

Follow this order on your personal laptop:

1. Add the new logo asset files in `client/src/assets/` and `client/public/`.
2. Replace the favicon in `client/public/favicon.svg`.
3. Update the navbar in `client/src/components/Navbar.tsx`.
4. Update logo areas in:
   - `client/src/pages/Login.tsx`
   - `client/src/pages/Register.tsx`
   - `client/src/pages/Terms.tsx`
   - `client/src/pages/NotFound.tsx`
   - `client/src/pages/Home.tsx`
5. Update browser title / metadata in `client/index.html`.
6. If needed, update brand colors in:
   - `client/src/index.css`
   - `client/tailwind.config.js`
7. Search again for `Learnova` across `client/src/` and clean up any remaining visible text references.
8. Run frontend build:

```bash
cd client
npm run build
```

## Search Commands To Use Later

Use these on your personal laptop to find remaining references quickly:

```bash
rg "Learnova" client/src client/index.html
rg "GraduationCap|BookOpen" client/src
rg "favicon.svg" client
```

## Recommended Implementation Pattern

If you want a cleaner long-term setup, create one shared logo component later, for example:

- `client/src/components/BrandLogo.tsx`

Then use that shared component in:

- navbar
- login
- register
- terms
- not found
- footer

That will make future logo updates much easier because you will not have to edit multiple files again.

