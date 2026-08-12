# Ancient Greek Wonders WebGIS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast bilingual static WebGIS for 37 ancient Greek wonders, ready for GitHub Pages and intentionally free of imagery.

**Architecture:** A no-build static site uses ES modules for catalog data, localization, filtering, and Leaflet integration. The map progressively enhances a searchable HTML interface, while all data and attribution remain in the repository.

**Tech Stack:** HTML5, CSS, JavaScript ES modules, Leaflet 1.9.4, Leaflet.markercluster 1.5.3, Node test runner, GitHub Pages Actions.

## Global Constraints

- Do not modify `ref/Lagoons`.
- Do not add Supabase, API keys, authentication, or a build-time framework.
- Do not download or bundle monument images; keep `heroImage` and `gallery` empty.
- Keep English and Greek content complete and equivalent.
- Make the deployed site work under an arbitrary GitHub Pages repository base path.

---

### Task 1: Catalog and filtering contract

**Files:**
- Create: `tests/catalog.test.js`
- Create: `src/data/wonders.js`
- Create: `src/core/catalog.js`

**Interfaces:**
- Produces `WONDERS`, `normalizeSearchText(value)`, and `filterWonders(records, state)`.

- [ ] Write tests that require 37 unique records, valid coordinates, complete bilingual fields, empty image fields, accent-insensitive bilingual search, and composable filters.
- [ ] Run `node --test` and verify failure because modules are absent.
- [ ] Implement the catalog and pure filtering functions.
- [ ] Run `node --test` and verify all tests pass.

### Task 2: Application shell and design system

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/i18n.js`
- Create: `src/app.js`

**Interfaces:**
- Consumes `WONDERS` and `filterWonders`.
- Produces the rendered result list, active filters, language switch, dialog content, and resilient no-map state.

- [ ] Add DOM-oriented tests for language labels and deterministic result markup.
- [ ] Verify the tests fail before the rendering helpers exist.
- [ ] Implement semantic markup, the bilingual application state, result rendering, filters, and accessible dialog.
- [ ] Verify unit tests pass.

### Task 3: Map behavior

**Files:**
- Create: `src/map/map.js`
- Modify: `src/app.js`
- Modify: `styles.css`

**Interfaces:**
- Produces `createWondersMap(element, records, callbacks)` and `updateMapRecords(records)`.

- [ ] Add tests for marker descriptors and stable category/status styling.
- [ ] Verify they fail before map helpers exist.
- [ ] Implement Leaflet initialization, clustered markers, hover cards, base layers, selection, and fly-to behavior.
- [ ] Verify tests pass and the no-map fallback remains usable.

### Task 4: Repository and deployment

**Files:**
- Create: `.gitignore`
- Create: `.github/workflows/pages.yml`
- Create: `README.md`
- Create: `LICENSE`
- Create: `404.html`

**Interfaces:**
- GitHub Pages publishes the repository root without a build step.

- [ ] Add a validation test for relative asset paths and required deployment files.
- [ ] Verify the validation fails before deployment files exist.
- [ ] Implement Pages deployment, documentation, license, and fallback redirect.
- [ ] Run the complete test suite.

### Task 5: Visual and accessibility verification

**Files:**
- Modify: `index.html`, `styles.css`, and JavaScript modules only where verification reveals defects.

- [ ] Serve the repository locally and inspect desktop and 390-pixel mobile layouts.
- [ ] Verify search, filters, language switching, marker selection, dialog focus, escape-to-close, empty results, and missing-image placeholders.
- [ ] Run the full test suite and inspect browser console output.
- [ ] Record final repository status and commit the completed application.
