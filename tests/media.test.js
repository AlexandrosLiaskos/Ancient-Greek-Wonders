import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

import { attachMedia, validateMediaRecord } from '../src/core/media.js';
import { MEDIA_BY_ID } from '../src/data/media.js';
import { WONDERS } from '../src/data/wonders.js';

const hero = {
  src: './assets/images/example/hero-960.webp',
  srcset: './assets/images/example/hero-960.webp 960w, ./assets/images/example/hero-1920.webp 1920w',
  width: 1920,
  height: 1280,
  alt: { en: 'Temple above the sea at sunset', el: 'Ναός πάνω από τη θάλασσα στο ηλιοβασίλεμα' },
  type: 'photo',
  creator: 'Example Photographer',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/'
};

test('media validation accepts a complete reusable local hero', () => {
  assert.doesNotThrow(() => validateMediaRecord({ hero, gallery: [] }));
});

test('media validation rejects incomplete provenance and unsafe paths', () => {
  assert.throws(() => validateMediaRecord({ hero: { ...hero, src: 'https://example.com/hotlink.jpg' } }), /local path/);
  assert.throws(() => validateMediaRecord({ hero: { ...hero, alt: { en: '', el: '' } } }), /bilingual alt/);
  assert.throws(() => validateMediaRecord({ hero: { ...hero, licenseUrl: 'http://example.com/license' } }), /HTTPS/);
});

test('attachMedia preserves order, maps stable ids and rejects unknown ids', () => {
  const records = [{ id: 'one', order: 1 }, { id: 'two', order: 2 }];
  const media = { one: { hero, gallery: [] } };
  const attached = attachMedia(records, media);

  assert.deepEqual(attached.map(({ id }) => id), ['one', 'two']);
  assert.equal(attached[0].media.hero.creator, 'Example Photographer');
  assert.equal(attached[1].media, null);
  assert.throws(() => attachMedia(records, { unknown: { hero, gallery: [] } }), /unknown record id/);
});

test('all curated media records have complete local heroes and at least two gallery images', async () => {
  const recordsWithMedia = WONDERS.filter(({ media }) => media);
  assert.deepEqual(Object.keys(MEDIA_BY_ID).sort(), recordsWithMedia.map(({ id }) => id).sort());
  for (const record of recordsWithMedia) {
    const hero = record.media?.hero;
    assert.ok(hero, `${record.id} is missing a hero`);
    validateMediaRecord(record.media);
    assert.ok(hero.width > 0 && hero.height > 0, `${record.id} has invalid dimensions`);
    assert.ok(hero.alt.en && hero.alt.el, `${record.id} lacks bilingual alt text`);
    assert.ok(hero.creator && hero.license, `${record.id} lacks attribution`);
    await access(resolve(hero.src.replace(/^\.\//, '')));
    assert.ok(record.media.gallery.length >= 2, `${record.id} needs at least two gallery images`);
    for (const asset of record.media.gallery) await access(resolve(asset.src.replace(/^\.\//, '')));
  }
});
