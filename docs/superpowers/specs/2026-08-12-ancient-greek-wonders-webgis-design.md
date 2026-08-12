# Ancient Greek Wonders WebGIS Design

## Scope

Build a new static, bilingual WebGIS at the repository root. `ref/Lagoons` remains reference material and is not modified. The release contains the 37 supplied entries, locally stored structured data, reliable coordinates, concise English and Greek descriptions, source links, search, filters, marker clustering, detail views, responsive behavior, and GitHub Pages deployment.

Images are intentionally excluded. Every record exposes empty `heroImage` and `gallery` fields, and the UI renders a neutral placeholder until the maintainer adds local image files.

## Architecture

The application is framework-free HTML, CSS, and ES modules. Leaflet and Leaflet.markercluster are loaded from pinned public CDNs; all monument data and application code are local. This keeps deployment transparent and avoids a build step, backend, keys, accounts, and runtime data services.

Focused modules own data, localization, filtering, and map presentation. State consists of current language, query, filters, and selected monument. URL query parameters preserve language and selected record without requiring a router.

## Information model

Each wonder has a stable slug, bilingual name and description, coordinates, city/region, country, category, period, construction date, survival status, Seven Wonders flag, image placeholders, and a list of citations. Duplicate geographic complexes remain separate records because the supplied list treats them as distinct wonders.

## Experience

The map opens on the eastern Mediterranean. Clustered markers expand naturally; selecting a result flies to it and opens its details. Search covers Greek and English text. Filters cover category, modern country, survival status, and membership in the canonical Seven Wonders.

The sidebar follows the Lagoons interaction model but is simplified to three tabs: Explore, Search, and About. A compact result count and active-filter chips keep state visible. The detail dialog is bilingual, keyboard accessible, and includes direct source links.

## Reliability

Descriptions distinguish ancient fabric, later reconstruction, and modern re-erection. Dates that remain debated are expressed as ranges or approximate dates. Coordinates locate the archaeological site or accepted historical location rather than claiming the exact footprint of a destroyed object. A methodology note explains that map positions are representative.

## Error and empty states

If Leaflet fails to load, the page keeps the searchable monument list and presents a clear map-unavailable message. Empty filter results explain how to reset. Missing images never cause broken media; the placeholder is the default state.

## Verification

Node's built-in test runner covers bilingual search normalization, filter composition, and result counting. A browser smoke test checks loading, language switching, filtering, opening a monument, keyboard focus, and mobile layout. Static links and dataset completeness are validated before release.
