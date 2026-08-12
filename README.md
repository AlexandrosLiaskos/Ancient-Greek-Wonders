# Wonders of the Ancient Greek World

A fast bilingual WebGIS for 37 monuments across Greece and the wider ancient Greek world. It is a static site: no database, account, API key, build step, or Supabase project is required.

## Features

- English and Greek interface and catalog content
- 37 curated monument records with representative coordinates, responsive imagery, and source links
- Leaflet map with marker clustering and three cartographic backgrounds
- Bilingual search plus type, country, condition, and Seven Wonders filters
- Accessible monument details and mobile bottom-sheet navigation
- GitHub Pages deployment through Actions

## Run locally

Serve the folder over HTTP so browser modules load correctly:

```powershell
npm run serve
```

Then open `http://localhost:4173`.

Run tests with:

```powershell
npm test
```

## Curated image workflow

All 37 heroes are checked-in local WebP files, so the published atlas never hotlinks an image or needs a runtime image service. `media/manifest.json` is the source of truth for each selection. A manifest entry contains the stable monument `id`, Wikimedia Commons file title, media type, bilingual alt text, and an optional focal point:

```js
{
  "id": "parthenon",
  "commonsTitle": "File:Example.jpg",
  "type": "photo",
  "alt": { "en": "…", "el": "…" },
  "focalPoint": "50% 50%"
}
```

To replace or rebuild imagery:

1. Choose an accurate, high-resolution Commons file with a supported reusable license.
2. Update its entry in `media/manifest.json`. Label interpretive material as `artwork`, `engraving`, `model`, or `reconstruction`, never as a photograph.
3. Run `npm run build:media`.
4. Review the 960-pixel output, then run `npm test`.

The pipeline accepts Public Domain, CC0, CC BY, and CC BY-SA media in supported 2.0–4.0 versions. It rejects unclear, NC, and ND licenses; downloads a build-sized source; emits 960/1920 WebP derivatives without upscaling; and regenerates `src/data/media.js` plus `ATTRIBUTIONS.md`. The derivatives are committed so GitHub Pages deployment remains fast, deterministic, and independent of Commons availability or rate limits. A designed placeholder remains available if a media record is intentionally removed.

## Publish with GitHub Pages

1. Create an empty GitHub repository and push this repository's `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Set **Source** to **GitHub Actions**.
4. Run the `Deploy static site to Pages` workflow or push to `main`.

All local links are repository-relative, so the site works under a project path such as `username.github.io/Ancient-Greek-Wonders/`.

## Data notes

Map coordinates identify an archaeological site or a commonly accepted historical location. They are representative for lost monuments and do not imply a precisely known original footprint. The source list prioritizes UNESCO, national cultural authorities, archaeological institutions, and established reference works.

## License

Application code is released under the MIT License. Monument descriptions, third-party map tiles, and curated images remain subject to their respective source terms. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for image creators, canonical source pages, and licenses.
