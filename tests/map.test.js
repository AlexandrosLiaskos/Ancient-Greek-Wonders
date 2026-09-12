import test from 'node:test';
import assert from 'node:assert/strict';

import { mapControlLabels, markerDescriptor, pinTooltipInsideMap, revealMarkerPreview } from '../src/map/map.js';
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
