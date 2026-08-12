import test from 'node:test';
import assert from 'node:assert/strict';

import { attachMedia, validateMediaRecord } from '../src/core/media.js';

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
