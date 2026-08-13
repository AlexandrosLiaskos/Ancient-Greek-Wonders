import test from 'node:test';
import assert from 'node:assert/strict';

import { formatClusterCount, formatResultCount, t, localizeRecord } from '../src/i18n.js';
import { createDetailMarkup, createMapPreviewMarkup, createResultMarkup } from '../src/ui/render.js';
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
  assert.match(markup, /<article class="result-item"/);
  assert.match(markup, /data-wonder-id="statue-zeus-olympia"/);
  assert.match(markup, /class="result-image"/);
  assert.match(markup, /data-result-action="focus"/);
  assert.match(markup, /data-result-action="details"/);
  assert.match(markup, /Statue of Zeus at Olympia/);
});

test('map preview connects the local hero to concise bilingual monument context', () => {
  const markup = createMapPreviewMarkup(WONDERS[9], 'el');
  assert.match(markup, /class="map-preview"/);
  assert.match(markup, /class="map-preview-image"/);
  assert.match(markup, /Παρθενώνας/);
  assert.match(markup, /Ακρόπολη Αθηνών, Ελλάδα/);
  assert.match(markup, /447–432 π\.Χ\./);
  assert.match(markup, /data-preview-details="parthenon"/);
});

test('detail markup presents responsive local media with visible provenance', () => {
  const markup = createDetailMarkup(WONDERS[1], 'en');
  const hero = WONDERS[1].media.hero;
  assert.match(markup, /<figure class="detail-figure">/);
  assert.match(markup, /<picture>/);
  assert.match(markup, /srcset="[^"]+ 960w, [^"]+ 1920w"/);
  assert.match(markup, /sizes="\(max-width: 760px\) 100vw, 50vw"/);
  assert.match(markup, new RegExp(`width="${hero.width}" height="${hero.height}"`));
  assert.match(markup, /decoding="async" fetchpriority="high"/);
  assert.match(markup, new RegExp(hero.alt.en));
  assert.match(markup, /class="media-credit"/);
  assert.match(markup, /target="_blank" rel="noopener noreferrer"/);
  assert.match(markup, new RegExp(hero.license));
  assert.match(markup, /class="detail-context"/);
  assert.match(markup, /37\.9497° N/);
  assert.match(markup, /27\.3639° E/);
});

test('interpretive media is labeled bilingually and missing media keeps the designed fallback', () => {
  const artwork = createDetailMarkup(WONDERS[0], 'el');
  assert.match(artwork, /class="media-type-badge">Ιστορική απεικόνιση</);
  const fallback = createDetailMarkup({ ...WONDERS[0], media: null, heroImage: '' }, 'en');
  assert.match(fallback, /class="image-placeholder"/);
  assert.doesNotMatch(fallback, /<img/);
});
