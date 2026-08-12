import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const USER_AGENT = 'AncientGreekWonders/1.0 (educational static atlas; local media build)';
const MAX_BYTES = 25 * 1024 * 1024;
const WIDTHS = [960, 1920];
const REUSABLE_LICENSE = /^(?:CC0|Public domain|CC BY(?:-SA)?(?: [234]\.[05])?)$/i;
const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

function stripMarkup(value = '') {
  return String(value).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function decodeDataUrl(url) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url);
  if (!match) throw new TypeError('Invalid data URL');
  return match[2] ? Buffer.from(match[3], 'base64') : Buffer.from(decodeURIComponent(match[3]));
}

async function fetchBuffer(url, fetchImpl = fetch, retries = 4) {
  if (url.startsWith('data:')) return decodeDataUrl(url);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(30_000),
        redirect: 'follow'
      });
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < retries) {
          const retryAfter = Number(response.headers.get('retry-after') ?? 15 * (attempt + 1));
          await wait(Math.min(Math.max(retryAfter, 15), 60) * 1000);
          continue;
        }
        throw new Error(`Image download failed with HTTP ${response.status}: ${url}`);
      }
      const declared = Number(response.headers.get('content-length') ?? 0);
      if (declared > MAX_BYTES) throw new Error(`Image exceeds ${MAX_BYTES} bytes: ${url}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_BYTES) throw new Error(`Image exceeds ${MAX_BYTES} bytes: ${url}`);
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      await wait(1000 * 2 ** attempt);
    }
  }
  throw lastError;
}

export async function getCommonsAsset(title, fetchImpl = fetch) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', titles: title,
    iiprop: 'url|size|extmetadata', iiurlwidth: '1920'
  });
  const response = await fetchImpl(api, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Commons metadata failed with HTTP ${response.status}: ${title}`);
  const page = (await response.json()).query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) throw new Error(`Commons file not found: ${title}`);
  const meta = info.extmetadata ?? {};
  const license = stripMarkup(meta.LicenseShortName?.value);
  if (!REUSABLE_LICENSE.test(license)) throw new Error(`Unsupported or unclear license "${license}" for ${title}`);
  return {
    downloadUrl: info.thumburl || info.url,
    sourceUrl: info.descriptionurl,
    sourceWidth: info.width,
    sourceHeight: info.height,
    creator: stripMarkup(meta.Artist?.value) || 'Unknown creator',
    date: stripMarkup(meta.DateTimeOriginal?.value || meta.DateTime?.value),
    license,
    licenseUrl: String(meta.LicenseUrl?.value || (license.toLowerCase() === 'public domain'
      ? 'https://creativecommons.org/publicdomain/mark/1.0/'
      : 'https://creativecommons.org/publicdomain/zero/1.0/')).replace(/^http:\/\//, 'https://')
  };
}

export async function buildMediaEntry(entry, { root = process.cwd(), fetchImpl = fetch, remoteOverride } = {}) {
  if (!/^[a-z0-9-]+$/.test(entry.id ?? '')) throw new TypeError('Media entry requires a safe record id');
  const remote = remoteOverride ?? (entry.commonsTitle ? await getCommonsAsset(entry.commonsTitle, fetchImpl) : {
    downloadUrl: entry.downloadUrl ?? entry.sourceUrl,
    sourceUrl: entry.sourcePage ?? entry.sourceUrl,
    creator: entry.creator,
    date: entry.date ?? '',
    license: entry.license,
    licenseUrl: entry.licenseUrl
  });
  const outputDir = resolve(root, 'assets', 'images', entry.id);
  await mkdir(outputDir, { recursive: true });
  const generated = [];
  let sourceDimensions;
  for (const width of WIDTHS) {
    const filename = `hero-${width}.webp`;
    try {
      await access(join(outputDir, filename));
      generated.push({ width, filename });
    } catch {}
  }
  if (!generated.length) {
    const source = await fetchBuffer(remote.downloadUrl, fetchImpl);
    const image = sharp(source, { failOn: 'warning' }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Unable to read image dimensions for ${entry.id}`);
    sourceDimensions = metadata;
    for (const width of WIDTHS) {
      if (metadata.width < width) continue;
      const filename = `hero-${width}.webp`;
      await image.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(outputDir, filename));
      generated.push({ width, filename });
    }
    if (!generated.length) {
      const width = metadata.width;
      const filename = `hero-${width}.webp`;
      await image.clone().webp({ quality: 82 }).toFile(join(outputDir, filename));
      generated.push({ width, filename });
    }
  }
  const highest = generated.at(-1);
  const originalWidth = sourceDimensions?.width ?? remote.sourceWidth ?? highest.width;
  const originalHeight = sourceDimensions?.height ?? remote.sourceHeight ?? highest.width;
  const outputWidth = highest.width;
  const outputHeight = Math.round(originalHeight * outputWidth / originalWidth);
  const base = `./assets/images/${entry.id}`;
  return {
    hero: {
      src: `${base}/${highest.filename}`,
      srcset: generated.map(({ width, filename }) => `${base}/${filename} ${width}w`).join(', '),
      width: outputWidth,
      height: outputHeight,
      alt: entry.alt,
      type: entry.type,
      creator: remote.creator,
      date: remote.date,
      sourceUrl: remote.sourceUrl,
      license: remote.license,
      licenseUrl: String(remote.licenseUrl).replace(/^http:\/\//, 'https://'),
      focalPoint: entry.focalPoint ?? '50% 50%'
    },
    gallery: []
  };
}

function mediaModule(mediaById) {
  return `// Generated by scripts/build-media.mjs. Keep source selections in media/manifest.json.\nexport const MEDIA_BY_ID = Object.freeze(${JSON.stringify(mediaById, null, 2)});\n`;
}

function attributions(entries, mediaById) {
  const rows = entries.map(({ id }) => {
    const hero = mediaById[id].hero;
    return `| ${id} | ${hero.creator.replaceAll('|', '\\|')} | [Source](${hero.sourceUrl}) | [${hero.license}](${hero.licenseUrl}) |`;
  });
  return `# Image Attributions\n\nAll published images are stored locally. The canonical source pages and reuse terms are listed below.\n\n| Monument ID | Creator | Source | License |\n|---|---|---|---|\n${rows.join('\n')}\n`;
}

export async function buildManifest(root = process.cwd(), fetchImpl = fetch) {
  const manifestPath = join(root, 'media', 'manifest.json');
  const entries = JSON.parse(await readFile(manifestPath, 'utf8'));
  let existingMedia = {};
  try {
    const existingModule = await import(`${pathToFileURL(join(root, 'src', 'data', 'media.js')).href}?cache=${Date.now()}`);
    existingMedia = existingModule.MEDIA_BY_ID ?? {};
  } catch {}
  const mediaById = {};
  for (const entry of entries) {
    let cached = false;
    const previous = existingMedia[entry.id]?.hero;
    const previousTitle = previous?.sourceUrl ? decodeURIComponent(new URL(previous.sourceUrl).pathname.split('/').at(-1)).replaceAll('_', ' ').replace(/^File:/, '') : '';
    const selectedTitle = entry.commonsTitle?.replace(/^File:/, '') ?? '';
    try {
      await access(join(root, 'assets', 'images', entry.id, 'hero-960.webp'));
      cached = !selectedTitle || previousTitle.toLowerCase() === selectedTitle.toLowerCase();
    } catch {}
    const remoteOverride = cached && previous ? {
      creator: previous.creator, date: previous.date, sourceUrl: previous.sourceUrl,
      sourceWidth: previous.width, sourceHeight: previous.height,
      license: previous.license, licenseUrl: previous.licenseUrl
    } : undefined;
    mediaById[entry.id] = await buildMediaEntry(entry, { root, fetchImpl, remoteOverride });
    await wait(cached ? 250 : 5000);
  }
  await mkdir(dirname(join(root, 'src', 'data', 'media.js')), { recursive: true });
  await writeFile(join(root, 'src', 'data', 'media.js'), mediaModule(mediaById));
  await writeFile(join(root, 'ATTRIBUTIONS.md'), attributions(entries, mediaById));
  return mediaById;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildManifest();
}
