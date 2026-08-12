import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildMediaEntry, getCommonsAsset } from '../scripts/build-media.mjs';

const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#245f56"/></svg>');

test('media builder creates WebP derivatives without upscaling', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wonders-media-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  const result = await buildMediaEntry({
    id: 'temple-example', sourceUrl: source, sourcePage: 'https://commons.wikimedia.org/wiki/File:Example.svg',
    type: 'photo', alt: { en: 'Example temple', el: 'Παράδειγμα ναού' }, creator: 'Example',
    license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
  }, { root, fetchImpl: fetch });

  assert.equal(result.hero.width, 960);
  assert.equal(result.hero.height, 640);
  assert.match(result.hero.srcset, /hero-960\.webp 960w/);
  assert.doesNotMatch(result.hero.srcset, /1920w/);
  await access(join(root, 'assets', 'images', 'temple-example', 'hero-960.webp'));
  assert.equal((await readFile(join(root, 'assets', 'images', 'temple-example', 'hero-960.webp'))).subarray(8, 12).toString(), 'WEBP');
});

test('media builder rejects unsafe ids before writing', async () => {
  await assert.rejects(
    buildMediaEntry({ id: '../escape', sourceUrl: 'data:image/svg+xml;base64,', sourcePage: 'https://example.com', type: 'photo' }, { root: tmpdir(), fetchImpl: fetch }),
    /safe record id/
  );
});

test('Commons metadata requests and prefers a build-sized derivative', async () => {
  let requestedUrl;
  const fetchImpl = async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ query: { pages: [{ imageinfo: [{
      url: 'https://upload.wikimedia.org/original.jpg',
      thumburl: 'https://upload.wikimedia.org/1920px-example.jpg',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.jpg', width: 6000, height: 4000,
      extmetadata: { LicenseShortName: { value: 'CC0' }, Artist: { value: 'Example' }, LicenseUrl: { value: 'http://creativecommons.org/publicdomain/zero/1.0/' } }
    }] }] } }));
  };
  const asset = await getCommonsAsset('File:Example.jpg', fetchImpl);
  assert.match(requestedUrl, /iiurlwidth=1920/);
  assert.equal(asset.downloadUrl, 'https://upload.wikimedia.org/1920px-example.jpg');
  assert.equal(asset.licenseUrl, 'https://creativecommons.org/publicdomain/zero/1.0/');
});
