import test from 'node:test';
import assert from 'node:assert/strict';

import { WONDERS } from '../src/data/wonders.js';
import { filterWonders, normalizeSearchText } from '../src/core/catalog.js';

test('catalog contains 37 complete, unique and geographically valid records', () => {
  assert.equal(WONDERS.length, 37);
  assert.equal(new Set(WONDERS.map(({ id }) => id)).size, 37);

  for (const wonder of WONDERS) {
    assert.match(wonder.id, /^[a-z0-9-]+$/);
    assert.ok(wonder.name.en && wonder.name.el, `${wonder.id}: bilingual name`);
    assert.ok(wonder.description.en && wonder.description.el, `${wonder.id}: bilingual description`);
    assert.ok(wonder.location.en && wonder.location.el, `${wonder.id}: bilingual location`);
    assert.ok(Number.isFinite(wonder.coordinates.lat));
    assert.ok(Number.isFinite(wonder.coordinates.lng));
    assert.ok(wonder.coordinates.lat >= 22 && wonder.coordinates.lat <= 46);
    assert.ok(wonder.coordinates.lng >= 9 && wonder.coordinates.lng <= 34);
    assert.deepEqual(wonder.gallery, []);
    assert.equal(wonder.heroImage, '');
    assert.ok(wonder.sources.length > 0, `${wonder.id}: source`);
  }
});

test('normalization makes Greek and Latin search accent-insensitive', () => {
  assert.equal(normalizeSearchText('  Ασκληπιείο  '), 'ασκληπιειο');
  assert.equal(normalizeSearchText('ÉPHÈSE'), 'ephese');
});

test('search matches either language and location', () => {
  assert.deepEqual(filterWonders(WONDERS, { query: 'καρυατιδες' }).map(({ id }) => id), ['erechtheion']);
  assert.deepEqual(filterWonders(WONDERS, { query: 'Bodrum' }).map(({ id }) => id), ['mausoleum-halicarnassus']);
});

test('filters compose by category, country, status and canonical wonder flag', () => {
  const records = filterWonders(WONDERS, {
    category: 'monument',
    country: 'Greece',
    status: 'lost',
    sevenWonder: true
  });

  assert.deepEqual(records.map(({ id }) => id), ['statue-zeus-olympia', 'colossus-rhodes']);
});

test('empty filter values leave the catalog unchanged', () => {
  assert.equal(filterWonders(WONDERS, { query: '', category: '', country: '', status: '' }).length, 37);
});
