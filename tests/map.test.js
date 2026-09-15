import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapControlLabels,
  markerDescriptor,
  pinTooltipInsideMap,
  revealMarkerPreview,
  createStackedClusterMarkup,
  getClusterBadgeSize,
  createStackedCategoryClusterIcon
} from '../src/map/map.js';
import { WONDERS } from '../src/data/wonders.js';

test('marker descriptor carries stable styling and non-color status text', () => {
  const descriptor = markerDescriptor(WONDERS[0], 'en');
  assert.equal(descriptor.id, 'statue-zeus-olympia');
  assert.equal(descriptor.className, 'wonder-marker wonder-marker--lost');
  assert.match(descriptor.label, /Lost/);
  assert.equal(descriptor.coordinates.length, 2);
  assert.equal(descriptor.previewId, 'statue-zeus-olympia');
  assert.equal(descriptor.status, 'Lost');
  assert.equal(typeof descriptor.iconMarkup, 'string');
  assert.match(descriptor.iconMarkup, /wonder-marker-glyph/);
  assert.doesNotMatch(descriptor.iconMarkup, />01</);
  assert.equal('order' in descriptor, false);
});

test('marker descriptor localizes labels without changing coordinates', () => {
  const en = markerDescriptor(WONDERS[9], 'en');
  const el = markerDescriptor(WONDERS[9], 'el');
  assert.equal(el.name, 'Παρθενώνας');
  assert.deepEqual(el.coordinates, en.coordinates);
});

test('map controls expose localized accessible names', () => {
  assert.deepEqual(mapControlLabels('en'), { zoomIn: 'Zoom in', zoomOut: 'Zoom out', layers: 'Map layers' });
  assert.deepEqual(mapControlLabels('el'), { zoomIn: 'Μεγέθυνση', zoomOut: 'Σμίκρυνση', layers: 'Επίπεδα χάρτη' });
});

test('preview reveal waits until a clustered marker is visible', () => {
  let opened = false;
  const marker = { openPopup: () => { opened = true; } };
  const cluster = { zoomToShowLayer: (received, done) => { assert.equal(received, marker); done(); } };
  revealMarkerPreview(cluster, marker);
  assert.equal(opened, true);
});

test('pinTooltipInsideMap flips direction and updates when overflowing top', () => {
  let updated = false;
  const tooltipEl = {
    getBoundingClientRect: () => ({ top: 2, bottom: 200, left: 10, right: 290 }),
    style: { translate: '' }
  };
  const tooltip = {
    options: { direction: 'top', offset: [0, -14] },
    getElement: () => tooltipEl,
    update: () => { updated = true; }
  };
  const map = {
    getContainer: () => ({
      getBoundingClientRect: () => ({ top: 0, bottom: 600, left: 0, right: 800 })
    })
  };
  pinTooltipInsideMap(tooltip, map, { margin: 8 });
  assert.equal(tooltip.options.direction, 'bottom');
  assert.equal(updated, true);
});

test('createStackedClusterMarkup produces purely colored category badges without black circle', () => {
  const categories = [
    { key: 'lost', label: 'Lost / submerged', color: '#b91c1c' },
    { key: 'ruins', label: 'Ruins / excavated', color: '#ea580c' },
    { key: 'extant', label: 'Standing / restored', color: '#0d9488' }
  ];

  // 1 category cluster
  const single = createStackedClusterMarkup({ ruins: 3 }, categories);
  assert.match(single.html, /class="cluster-stack-wrapper"/);
  assert.match(single.html, /class="cluster-stack-badge"/);
  assert.doesNotMatch(single.html, /#000/);
  assert.doesNotMatch(single.html, /background:#000/);
  assert.match(single.html, /background:#ea580c/);
  assert.match(single.html, />3<\/span>/);
  assert.equal(single.width, 20);

  // 2 categories cluster: clean horizontal pair
  const pair = createStackedClusterMarkup({ ruins: 4, extant: 2 }, categories);
  assert.match(pair.html, /class="cluster-stack-wrapper"/);
  assert.doesNotMatch(pair.html, /is-triad/);
  assert.match(pair.html, /background:#ea580c/);
  assert.match(pair.html, /background:#0d9488/);
  assert.equal(pair.width, 37); // 22 + (20 - 5)
  assert.equal(pair.height, 22);

  // 3 categories cluster: compact triad with third badge above
  const multi = createStackedClusterMarkup({ lost: 1, ruins: 4, extant: 2 }, categories);
  assert.match(multi.html, /class="cluster-stack-wrapper is-triad"/);
  assert.match(multi.html, /class="cluster-stack-row is-top"/);
  assert.match(multi.html, /class="cluster-stack-row is-bottom"/);
  assert.match(multi.html, /background:#b91c1c/);
  assert.match(multi.html, /background:#ea580c/);
  assert.match(multi.html, /background:#0d9488/);
  assert.match(multi.html, />1<\/span>/);
  assert.match(multi.html, />4<\/span>/);
  assert.match(multi.html, />2<\/span>/);
  assert.doesNotMatch(multi.html, /#000/);
  // Bottom row: lost(20) + ruins(22 - 5) = 37px; Top: extant(20) centered above.
  // Height: top(20) + bottom(22) - overlap(5) = 37px.
  assert.equal(multi.width, 37);
  assert.equal(multi.height, 37);
});

test('getClusterBadgeSize scales progressively with count while remaining compact', () => {
  assert.equal(getClusterBadgeSize(1), 20);
  assert.equal(getClusterBadgeSize(3), 20);
  assert.equal(getClusterBadgeSize(4), 22);
  assert.equal(getClusterBadgeSize(9), 22);
  assert.equal(getClusterBadgeSize(10), 24);
  assert.equal(getClusterBadgeSize(25), 26);
  assert.equal(getClusterBadgeSize(50), 26);
  assert.ok(getClusterBadgeSize(50) < 30, 'Even largest cluster badge stays far smaller than old 44px black circle');
});
