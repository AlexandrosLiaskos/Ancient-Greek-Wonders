import test from 'node:test';
import assert from 'node:assert/strict';

import { formatClusterCount, formatResultCount, t, localizeRecord } from '../src/i18n.js';
import { createResultMarkup } from '../src/ui/render.js';
import { WONDERS } from '../src/data/wonders.js';

test('translation returns complete labels in both languages', () => {
  assert.equal(t('en', 'search'), 'Search monuments');
  assert.equal(t('el', 'search'), 'Αναζήτηση μνημείων');
  assert.equal(t('el', 'openCatalog'), 'Άνοιγμα καταλόγου');
  assert.equal(t('el', 'mapLabel'), 'Χάρτης των θαυμάτων του αρχαίου ελληνικού κόσμου');
  assert.equal(t('el', 'skipToMap'), 'Μετάβαση στον χάρτη');
  assert.equal(t('el', 'legendLabel'), 'Υπόμνημα χάρτη');
});

test('result and cluster counts use correct singular and plural grammar', () => {
  assert.equal(formatResultCount('en', 1), '1 monument shown');
  assert.equal(formatResultCount('en', 2), '2 monuments shown');
  assert.equal(formatResultCount('el', 1), 'Εμφανίζεται 1 μνημείο');
  assert.equal(formatResultCount('el', 2), 'Εμφανίζονται 2 μνημεία');
  assert.equal(formatClusterCount('en', 3), '3 monuments');
  assert.equal(formatClusterCount('el', 3), '3 μνημεία');
});

test('localizeRecord selects the requested bilingual fields', () => {
  const localized = localizeRecord(WONDERS[0], 'el');
  assert.equal(localized.name, 'Άγαλμα του Διός στην Ολυμπία');
  assert.equal(localized.location, 'Ολυμπία, Ηλεία, Ελλάδα');
});

test('result markup remains semantic and exposes the stable record id', () => {
  const markup = createResultMarkup(WONDERS[0], 'en');
  assert.match(markup, /<button/);
  assert.match(markup, /data-wonder-id="statue-zeus-olympia"/);
  assert.match(markup, /Statue of Zeus at Olympia/);
});
