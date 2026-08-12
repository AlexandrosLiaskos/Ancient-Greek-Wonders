# Wonders of the Ancient Greek World

A fast bilingual WebGIS for 37 monuments across Greece and the wider ancient Greek world. It is a static site: no database, account, API key, build step, or Supabase project is required.

## Features

- English and Greek interface and catalog content
- 37 curated monument records with representative coordinates and source links
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

## Add your own images

Images are intentionally absent. Put your chosen files under a new `assets/images/` directory, then edit the relevant record in `src/data/wonders.js`:

```js
heroImage: './assets/images/parthenon/hero.jpg',
gallery: [
  './assets/images/parthenon/detail-01.jpg',
  './assets/images/parthenon/detail-02.jpg'
]
```

Until `heroImage` has a value, the application shows a designed placeholder rather than a broken image. Before publishing media, record creator, source URL, license, and any modifications in a separate attribution file.

## Publish with GitHub Pages

1. Create an empty GitHub repository and push this repository's `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Set **Source** to **GitHub Actions**.
4. Run the `Deploy static site to Pages` workflow or push to `main`.

All local links are repository-relative, so the site works under a project path such as `username.github.io/Ancient-Greek-Wonders/`.

## Data notes

Map coordinates identify an archaeological site or a commonly accepted historical location. They are representative for lost monuments and do not imply a precisely known original footprint. The source list prioritizes UNESCO, national cultural authorities, archaeological institutions, and established reference works.

## License

Application code is released under the MIT License. Monument descriptions and third-party map tiles remain subject to their respective source terms. Future images must be licensed and attributed separately.
