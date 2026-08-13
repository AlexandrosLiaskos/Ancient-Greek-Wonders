# Lagoons UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the atlas as a cohesive map-first experience using the proven spatial and interaction patterns of the Lagoons reference.

**Architecture:** Keep the static vanilla-JS application and Leaflet map, but separate reusable preview/result rendering from application state orchestration. Reshape the existing semantic HTML and tokenized CSS into a compact desktop workbench and mobile bottom sheet; retain URL-driven state and local media.

**Tech Stack:** HTML, CSS, ES modules, Leaflet, Leaflet.markercluster, Node test runner, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-13-lagoons-ux-redesign.md`

## Global Constraints

- No backend, database, authentication, runtime image service, or UI framework.
- Preserve all 37 bilingual records and local licensed images.
- Meet WCAG 2.2 AA where practical and remain usable at 320 CSS pixels.
- Motion lasts 150–220 ms and has a reduced-motion alternative.
- The map remains the primary surface on desktop and mobile.

---

### Task 1: Preview and result presentation

**Files:**
- Modify: `src/ui/render.js`
- Modify: `tests/ui.test.js`

**Interfaces:**
- Consumes: localized wonder records and `record.media.hero`
- Produces: `createMapPreviewMarkup(record, language)` and image-backed `createResultMarkup(record, language)`

- [ ] Add failing assertions for a preview containing local image, localized identity, period, status, and explicit detail action.
- [ ] Run `node --test tests/ui.test.js` and confirm the new assertions fail because the preview renderer is absent.
- [ ] Implement escaped preview and richer result markup without changing media provenance behavior.
- [ ] Re-run `node --test tests/ui.test.js` and confirm it passes.

### Task 2: Map preview lifecycle

**Files:**
- Modify: `src/map/map.js`
- Modify: `tests/map.test.js`

**Interfaces:**
- Consumes: `createMapPreviewMarkup`, records, `onSelect(id)`, `onPreview(id)`
- Produces: marker hover/focus preview, `focus(record, { openPreview })`, `closePreview()`

- [ ] Add failing tests for localized marker preview descriptors and preview-capable controller behavior.
- [ ] Run `node --test tests/map.test.js` and confirm the intended failure.
- [ ] Replace the text-only tooltip with an interactive Leaflet popup/preview lifecycle while preserving marker clustering and keyboard labels.
- [ ] Re-run map tests.

### Task 3: Unified filter and selection state

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/core/url-state.js`
- Modify: `tests/url-state.test.js`

**Interfaces:**
- Consumes: existing query/category/country/status/sevenWonder state
- Produces: removable filter controls, synchronized result selection, mobile sheet lifecycle, stable URL state

- [ ] Add failing URL/state assertions for active panel and selected monument preservation through filter removal.
- [ ] Run `node --test tests/url-state.test.js` and confirm failure.
- [ ] Reshape semantic controls and implement event delegation for removable filters and result focus/detail actions.
- [ ] Re-run URL/state tests.

### Task 4: Map-first responsive visual system

**Files:**
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `tests/deployment.test.js`

**Interfaces:**
- Consumes: revised semantic class structure
- Produces: compact masthead, 400px desktop workbench, map overlays, preview card, mobile action bar and bottom sheet

- [ ] Add failing structural assertions for mobile controls, preview action hooks, and compact workbench landmarks.
- [ ] Run `node --test tests/deployment.test.js` and confirm failure.
- [ ] Implement the layout and complete default/hover/focus/active/empty/dialog responsive states.
- [ ] Re-run deployment tests.

### Task 5: Rich detail record and final integration

**Files:**
- Modify: `src/ui/render.js`
- Modify: `styles.css`
- Modify: `src/i18n.js`
- Modify: `tests/ui.test.js`

**Interfaces:**
- Consumes: localized record, hero media, coordinates, source metadata
- Produces: image-led record with structured geographic/historical facts and bilingual actions

- [ ] Add failing detail assertions for coordinate context, structured facts, and bilingual actions.
- [ ] Run UI tests and confirm failure.
- [ ] Implement the detail composition and translations.
- [ ] Run the full `npm test`, `npm run prepare:pages`, and `git diff --check`.
- [ ] Verify desktop/tablet/mobile flows in a browser and correct any regression with a failing test first.
- [ ] Commit, push `main`, wait for GitHub Pages deployment, and verify HTTP 200.

