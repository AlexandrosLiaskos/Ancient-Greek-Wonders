# Curated Monument Imagery Design

## Goal

Give every catalog entry a visually commanding, locally stored hero image while preserving historical honesty, page speed, bilingual accessibility, and verifiable reuse rights.

## Visual Direction

The imagery should feel museum-grade and cinematic rather than promotional. Surviving monuments use strong documentary photography with architectural scale, dramatic natural light, legible form, and minimal tourist clutter. Lost monuments use historically significant artworks, engravings, archaeological models, or scholarly reconstructions only when the medium is identified clearly. AI-generated imagery is excluded.

## Selection Rules

- Curate one primary hero image for all 37 records.
- Add gallery images only when they contribute a materially different view, detail, historical state, or reconstruction; quantity is not a goal.
- Prefer Wikimedia Commons, national cultural institutions, UNESCO, museums, and other collections that publish explicit reuse terms.
- Prefer public-domain, CC0, CC BY, or CC BY-SA works. Do not use non-commercial, no-derivatives, unclear, or merely editorial-use licenses.
- Verify the actual file page, creator, license, and source URL before download. Search-result thumbnails are not sufficient evidence.
- Avoid watermarks, captions baked into the image, low-resolution files, distorted panoramas, aggressive HDR, and implausible color grading.
- For uncertain or reconstructed subjects, state the image type in both languages rather than presenting it as documentary fact.

## Asset Pipeline

- Store originals only when needed for provenance; ship optimized local WebP derivatives under `assets/images/<record-id>/`.
- Hero derivatives target roughly 1600–2000 pixels on the long edge with visually high WebP quality and stripped nonessential metadata.
- Preserve the original aspect ratio in the archive metadata; render heroes through responsive `srcset` derivatives where worthwhile.
- Use stable, descriptive filenames rather than remote titles or numeric IDs.
- No runtime hotlinking. The published site must not depend on third-party image servers.

## Data Model

Each record receives a `media` object containing:

- local hero path and intrinsic width/height;
- bilingual alt text;
- bilingual media-type label when the image is an artwork, model, or reconstruction;
- creator, creation date when known, source page, license name, and license URL;
- optional gallery entries using the same schema.

A generated human-readable `ATTRIBUTIONS.md` will mirror this metadata so credits remain visible outside the application.

## Interface

- Replace the numbered placeholder with the hero image while retaining the current split detail composition.
- Add a quiet media-type badge only for artworks, models, engravings, and reconstructions.
- Add an image credit directly beneath the media rather than hiding provenance exclusively in a separate page.
- Add an expandable gallery only for records with additional curated images.
- Use explicit image dimensions, responsive sources, async decoding, and lazy loading for non-primary gallery media.
- Keep text and controls fully usable if an image fails; never show a broken-image icon as the only state.

## Accessibility and Performance

- Alt text describes the visible subject and viewpoint, not the monument description or photographer credit.
- Decorative gallery thumbnails use meaningful button labels; full images retain useful alt text.
- Credits and license links remain keyboard accessible and bilingual where interface copy is involved.
- The first opened hero may load eagerly; gallery media loads lazily.
- Mobile crops must preserve the monument’s principal architectural feature and avoid text overlays.

## Verification

- Automated tests require valid local paths, intrinsic dimensions, alt text in both languages, creator, source URL, license, and license URL for every hero.
- The Pages artifact test confirms all referenced derivatives are included and development/original working files are excluded.
- A link check validates attribution source pages without treating anti-bot `403` responses from known institutions as broken links automatically.
- Browser QA covers representative documentary photographs, artworks/reconstructions, gallery entries, missing-file fallback, English/Greek, and 320-pixel mobile layout.

## Scope Boundary

This pass curates and integrates reusable images. It does not generate synthetic reconstructions, alter archaeological facts, or publish media with ambiguous rights. If no suitably licensed image exists for a subject, the designed placeholder remains until a defensible asset is found.
