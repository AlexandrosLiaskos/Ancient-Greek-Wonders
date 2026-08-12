# Curated Monument Imagery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curate, download, optimize, attribute, and display one compelling openly licensed hero image for every monument, with optional galleries where a second image adds historical value.

**Architecture:** A checked-in `media/manifest.json` is the provenance source of truth. A Node script validates each Commons/institutional source, downloads approved originals, produces local responsive WebP derivatives under `assets/images/`, and generates `src/data/media.js` plus `ATTRIBUTIONS.md`; runtime catalog records merge media by stable record ID. The detail renderer uses intrinsic dimensions, responsive sources, bilingual alt text, a media-type badge for non-documentary imagery, an inline credit, and a resilient fallback.

**Tech Stack:** Static ES modules, Node 22, built-in Node test runner, MediaWiki/Wikimedia Commons APIs, Sharp 0.35.x as a development-only image processor, HTML/CSS, GitHub Pages.

## Global Constraints

- Curate one primary hero image for all 37 records.
- Use documentary photography for surviving sites and explicitly labeled artworks, engravings, models, or scholarly reconstructions for lost monuments.
- Exclude AI-generated imagery and media with NC, ND, editorial-only, or unclear licenses.
- Store published media locally; no runtime image hotlinks.
- Record creator, source page, license name, license URL, intrinsic dimensions, and bilingual alt text for every hero.
- Produce 960-pixel and 1920-pixel WebP derivatives at quality 82; never upscale a source below the requested width.
- Keep a designed fallback when a source or local derivative is unavailable.

---

### Task 1: Media schema and catalog merge

**Files:**
- Create: `src/data/media.js`
- Create: `src/core/media.js`
- Create: `tests/media.test.js`
- Modify: `src/data/wonders.js`

**Interfaces:**
- Consumes: `WONDERS: Wonder[]` from `src/data/wonders.js`.
- Produces: `MEDIA_BY_ID: Record<string, MediaRecord>` and `attachMedia(records, mediaById): WonderWithMedia[]`.

- [ ] **Step 1: Write the failing schema test**

Assert that `attachMedia` maps by stable ID, preserves catalog order, supplies `media.hero`, and rejects unknown manifest IDs. Use a literal fixture with `src`, `srcset`, `width`, `height`, bilingual `alt`, `type`, `creator`, `sourceUrl`, `license`, and `licenseUrl`.

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test tests/media.test.js`; expect `ERR_MODULE_NOT_FOUND` for `src/core/media.js`.

- [ ] **Step 3: Implement schema validation and merge**

Implement `validateMediaRecord(record)` with explicit errors for absent path, non-positive dimensions, missing bilingual alt text, non-HTTPS provenance URLs, and unsupported media types (`photo`, `artwork`, `engraving`, `model`, `reconstruction`). Implement `attachMedia` without mutating source records.

- [ ] **Step 4: Add the generated media module boundary**

Create `src/data/media.js` exporting an initially empty frozen object. Change `wonders.js` to export `WONDERS` through `attachMedia(RAW_WONDERS, MEDIA_BY_ID)` while retaining stable IDs and all textual data.

- [ ] **Step 5: Run all tests and commit**

Run `npm test`; commit as `feat: add licensed media schema`.

### Task 2: Reproducible image pipeline

**Files:**
- Create: `media/manifest.json`
- Create: `scripts/build-media.mjs`
- Create: `tests/media-build.test.js`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: manifest entries `{id, commonsTitle|sourceUrl, type, alt, focalPoint}`.
- Produces: `assets/images/<id>/hero-960.webp`, `hero-1920.webp`, `src/data/media.js`, and `ATTRIBUTIONS.md`.

- [ ] **Step 1: Write a failing pipeline integration test**

Create a temporary 1200×800 fixture image with Sharp, pass a literal media entry to `buildMediaEntry`, and assert a 960-pixel WebP is emitted, a 1920 filename is omitted because upscaling is forbidden, metadata is preserved, and unsafe output paths are rejected.

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test tests/media-build.test.js`; expect the build script import to fail.

- [ ] **Step 3: Add Sharp and implement deterministic processing**

Install exact dev dependency `sharp@0.35.3` (the first release line that resolves GHSA-f88m-g3jw-g9cj). Implement downloads with a descriptive User-Agent, 30-second timeout, maximum 25 MB response size, HTTP status validation, and retry once for 429/5xx. Process with autorotation, no enlargement, WebP quality 82, and strip nonessential metadata.

- [ ] **Step 4: Implement provenance generation**

For Wikimedia Commons entries, call `action=query&prop=imageinfo&iiprop=url|size|extmetadata` and require a reusable license plus artist and canonical description URL. Generate stable JavaScript using JSON serialization and a deterministic Markdown attribution table ordered by catalog order.

- [ ] **Step 5: Run focused/full tests and commit**

Run `node --test tests/media-build.test.js`, `npm test`, and commit as `build: add reproducible media pipeline`.

### Task 3: Curate the 37 hero images

**Files:**
- Modify: `media/manifest.json`
- Create/modify generated: `assets/images/**`, `src/data/media.js`, `ATTRIBUTIONS.md`

**Interfaces:**
- Consumes: stable IDs from `WONDERS` and verified source file pages.
- Produces: exactly one complete hero entry per record ID.

- [ ] **Step 1: Build candidate lists**

For each ID, search Wikimedia Commons and the relevant institutional collection using the English monument name plus location. Keep up to three candidates that satisfy license and resolution constraints. Prefer wide architectural compositions, readable silhouettes, natural light, limited crowds, and a long edge of at least 1600 pixels.

- [ ] **Step 2: Visually inspect candidates**

Download 480-pixel previews into a temporary review directory and generate contact sheets grouped as: Seven Wonders; Athens/Attica; Olympia/Delphi/Peloponnese; islands/Crete; Türkiye/Egypt/Libya; Sicily/Paestum. Inspect every sheet and select one hero per ID; select a second image only when it adds an interior, detail, historical artwork, or reconstruction not represented by the hero.

- [ ] **Step 3: Record explicit media types**

Use `photo` for documentary site photographs. Use `artwork`, `engraving`, `model`, or `reconstruction` for lost or interpretive subjects, and provide bilingual type labels through runtime i18n. Never label a reconstruction as a photograph.

- [ ] **Step 4: Run the pipeline and completeness test**

Run `npm run build:media`, then `node --test tests/media.test.js`. The test must assert 37 heroes, exact ID parity with `WONDERS`, existing local files, dimensions, bilingual alt text, creator, canonical source URL, license, and license URL.

- [ ] **Step 5: Review final 960-pixel contact sheets and commit**

Reject weak crops, unreadable monuments, duplicate viewpoints, watermarks, and inaccurate reconstructions. Commit manifest, derivatives, generated data, and attributions as `content: curate monument photography and artworks`.

### Task 4: Detail media, gallery, and attribution UI

**Files:**
- Modify: `src/ui/render.js`
- Modify: `src/i18n.js`
- Modify: `styles.css`
- Modify: `tests/ui.test.js`

**Interfaces:**
- Consumes: `record.media.hero` and optional `record.media.gallery`.
- Produces: semantic `<picture>`, media badge, inline attribution, gallery buttons, and fallback markup.

- [ ] **Step 1: Write failing render tests**

Assert documentary heroes render `width`, `height`, `srcset`, `sizes`, `decoding="async"`, escaped bilingual alt text, and credit/license links. Assert reconstructions render a bilingual media-type badge. Assert absent media renders the existing placeholder without a broken `<img>`.

- [ ] **Step 2: Run focused test and verify RED**

Run `node --test tests/ui.test.js`; expect missing responsive media markup.

- [ ] **Step 3: Implement hero and credit rendering**

Render `<picture>` with 960/1920 WebP candidates, intrinsic dimensions, `fetchpriority="high"` for the active hero, and a figure caption containing creator plus license link. Keep every interpolated field escaped.

- [ ] **Step 4: Implement optional gallery**

Render gallery thumbnails only when entries exist. Buttons expose bilingual `aria-label` values; selected state uses `aria-pressed`; full gallery images load lazily and reuse the same attribution component.

- [ ] **Step 5: Style and verify responsive composition**

Preserve the split desktop layout, place the credit on a dark readable strip, prevent portrait/landscape overflow with `object-fit: cover` plus manifest focal points, and use a horizontal snap gallery on mobile without hiding controls.

- [ ] **Step 6: Run tests and commit**

Run `npm test`; commit as `feat: present responsive monument imagery`.

### Task 5: Published artifact and failure hardening

**Files:**
- Modify: `scripts/prepare-pages.mjs`
- Modify: `tests/pages-build.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: checked-in `assets/images/` and `ATTRIBUTIONS.md`.
- Produces: `_site/assets/images/**` and `_site/ATTRIBUTIONS.md` without originals, previews, or manifest working files.

- [ ] **Step 1: Write failing artifact assertions**

Extend the fixture to include a derivative, an attribution file, and a `media/review` file. Assert derivatives and attributions are published while `media/`, originals, and review sheets are excluded.

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test tests/pages-build.test.js`; expect missing `_site/ATTRIBUTIONS.md`.

- [ ] **Step 3: Update artifact staging and documentation**

Copy `assets` and `ATTRIBUTIONS.md` when present. Document `npm run build:media`, manifest fields, license acceptance policy, image replacement workflow, and why generated derivatives are committed.

- [ ] **Step 4: Run clean-install verification and commit**

Run `npm ci`, `npm test`, `npm run prepare:pages`, verify `_site` contains all referenced paths, then commit as `docs: document licensed image workflow`.

### Task 6: Browser, performance, and license QA

**Files:**
- Modify only files implicated by verified QA failures.

**Interfaces:**
- Consumes: the complete local site and generated Pages artifact.
- Produces: a clean, visually reviewed, releasable commit.

- [ ] **Step 1: Serve the generated artifact**

Run `npm run prepare:pages` and serve `_site` over HTTP. Test English and Greek deep links for one photograph, one artwork/reconstruction, one gallery, and a forced missing-file fallback.

- [ ] **Step 2: Check responsive viewports**

Inspect 320×700, 390×844, 768×1024, and 1440×900. Confirm stable layout, legible credits, correct crops, usable gallery controls, zero horizontal overflow, and no focus traps.

- [ ] **Step 3: Check runtime and performance**

Require no console errors, no broken requests, HTML validation success, all automated tests passing, Lighthouse accessibility/best-practices scores of 100, and performance of at least 85 on the image-bearing initial map.

- [ ] **Step 4: Audit every license row**

Confirm all 37 hero rows in `ATTRIBUTIONS.md` match their canonical source page and generated runtime metadata. Treat known institutional anti-bot 403 responses as manual-review items, not automatic success.

- [ ] **Step 5: Run final verification and commit fixes**

Run `npm ci && npm test && npm run prepare:pages`, `git diff --check`, the impeccable detector, and browser error-log inspection. Commit verified QA fixes as `fix: polish curated monument media` only if changes were required.
