# Lagoons UX Redesign

## Goal

Transform Ancient Greek Wonders from a surface-level visual homage into a cohesive map-first atlas that inherits the strongest spatial and interaction patterns of the Lagoons reference while remaining bilingual, static, fast, accessible, and historically honest.

## Product experience

The map is the application canvas. A compact masthead establishes identity without consuming exploration space. A persistent desktop workbench combines a narrow tool rail with a focused panel; mobile replaces it with reachable bottom controls and a bottom sheet. Every search, filter, marker, count, preview, and detail state stays synchronized.

The primary journey is:

1. Understand the geographic field immediately.
2. Discover a monument through map hover, search, or filters.
3. See a useful preview without losing map context.
4. Open a rich, image-led record with provenance and return cleanly to the same map state.

## Information architecture

- **Masthead:** compact identity strip, bilingual title, language control, mobile menu.
- **Tool rail:** Explore, Search, and About, with persistent labels/tooltips and clear selected state.
- **Explore panel:** live result count, variable-oriented filters, active removable filters, reset, compact legend, and a scrollable monument register.
- **Search panel:** immediate bilingual search, result count, and image-backed result rows.
- **Map canvas:** primary surface with restrained basemap, meaningful clusters, monument markers, hover previews, layer/zoom controls, legend and coordinate/status bar.
- **Detail view:** full, high-quality record presentation inspired by Lagoons: strong heading, panoramic hero, geographic context, structured facts, description, and sources.
- **Mobile:** full map first, persistent bottom action bar, bottom sheet for Explore/Search/About, and full-height detail sheet.

## Visual direction

Use the existing archaeological identity—near-white stone, ink, verdigris, bronze, Cormorant Garamond for monumental names, IBM Plex for controls—but apply Lagoons' discipline: compact framing, deliberate hairlines, stronger internal rhythm, precise hierarchy, and map-led composition. The display type is reserved for identity and monument names; controls and data remain utilitarian.

The signature element is the monument preview card: a photographic crop fused to a compact archaeological record, floating directly over the map and connecting image, place, period, status, and action.

## Interaction model

- Hovering or keyboard-focusing a marker reveals a stable preview card; leaving closes it unless focus moves into the card.
- Clicking a marker or result opens the detail view and updates the URL.
- Search and filters update markers, clusters, counts, results, active filter chips, and empty state immediately.
- Clicking a result first focuses its marker and opens the preview; its explicit details action opens the full record.
- Active filters are individually removable and resettable.
- Escape closes the topmost surface: detail, mobile sheet, then preview.
- Language switching preserves filters, selected monument, active panel, map position, and open surface.
- Motion communicates focus and surface transitions in 150–220 ms and respects reduced motion.

## Responsive behavior

- Desktop (>= 900px): compact masthead, 400px workbench, remaining viewport is map.
- Tablet (761–899px): narrower panel and reduced header typography; no horizontal overflow.
- Mobile (<= 760px): map fills the viewport below a 60px masthead; bottom controls stay in the thumb zone; the catalog is a 70–82dvh bottom sheet with drag-handle styling and internal scroll.
- Detail content becomes a full-height scroll surface; hero remains prominent without trapping content below the fold.
- Complete functionality remains usable at 320 CSS pixels and 200% zoom.

## States and accessibility

- Default, filtered, no-results, selected, detail-open, map-unavailable, and mobile-sheet states are explicit.
- All controls have visible names, hover/focus/active states, 44px touch targets, and logical keyboard order.
- Marker meaning is never color-only; labels include monument name and survival state.
- Search/filter result changes use an ARIA live region.
- Dialog and sheet focus are managed and restored.
- Body text meets WCAG AA contrast; reduced motion is supported.

## Technical constraints

- Preserve the zero-backend static GitHub Pages architecture.
- Preserve the 37-record bilingual catalog and checked-in licensed WebP assets.
- Continue using Leaflet and marker clustering; add no UI framework.
- Keep state shareable through URL parameters.
- Avoid runtime image services and hotlinks.
- Keep local assets lazy except the currently opened hero.

## Verification

- Unit tests cover preview markup, synchronized filtering, removable filter state, URL preservation, and translated labels.
- Existing catalog, media, map, deployment, and Pages tests remain green.
- Browser verification covers desktop, tablet, and 320–390px mobile layouts, marker preview, search/filter flow, detail opening/closing, language switching, keyboard Escape, no overflow, and console errors.

