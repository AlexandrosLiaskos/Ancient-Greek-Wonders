import test from 'node:test';
import assert from 'node:assert/strict';

import { t, localizeRecord } from '../src/i18n.js';
import { createResultMarkup } from '../src/ui/render.js';
import { WONDERS } from '../src/data/wonders.js';

test('translation returns complete labels in both languages', () => {
  assert.equal(t('en', 'search'), 'Search monuments');
  assert.equal(t('el', 'search'), 'Αναζήτηση μνημείων');
  assert.equal(t('el', 'openCatalog'), 'Άνοιγμα καταλόγου');
  assert.equal(t('el', 'mapLabel'), 'Χάρτης των θαυμάτων του αρχαίου ελληνικού κόσμου');
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
