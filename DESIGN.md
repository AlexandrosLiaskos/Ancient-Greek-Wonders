# Design System

## Direction

The Lagoons reference is translated into a monochrome archaeological atlas: an editorial masthead, a compact black tool rail, a white working panel, and a desaturated cartographic field. Verdigris anchors the interface like weathered bronze; a darker bronze is reserved for selected monuments and focus.

## Palette

- `--ink`: `oklch(0.18 0.01 75)`
- `--surface`: `oklch(0.985 0 0)`
- `--surface-muted`: `oklch(0.955 0.008 80)`
- `--line`: `oklch(0.48 0.01 75)`
- `--muted`: `oklch(0.42 0.012 75)`
- `--verdigris`: `oklch(0.42 0.077 160)`
- `--verdigris-light`: `oklch(0.90 0.035 160)`
- `--bronze`: `oklch(0.48 0.13 55)`

## Typography

- Display and monument names: Cormorant Garamond, with Georgia fallback.
- Interface and prose: IBM Plex Sans, with system-ui fallback.
- Coordinates and dates: IBM Plex Mono, with Consolas fallback.

## Layout

Desktop uses a centered masthead over a two-column application shell. The 360-pixel sidebar contains a 52-pixel tool rail and one scrollable panel. Mobile keeps the full map and presents the sidebar as a dismissible bottom sheet.

## Components

- Map markers are compact circles with an order-derived symbol and text-independent category styling.
- Hover cards show bilingual name, place, date, and category.
- The detail surface is a wide dialog with a reserved image region. When no `heroImage` is configured, it shows a quiet numbered placeholder and explicit instructions for the maintainer.
- Filters use native controls and removable chips. Search matches both languages and locations.

## Motion

Use 180–220 ms state transitions for panels, selection, and hover only. Reduced-motion mode removes transforms and shortens transitions to near-instant.
