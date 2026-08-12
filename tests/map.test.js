import test from 'node:test';
import assert from 'node:assert/strict';

import { mapControlLabels, markerDescriptor } from '../src/map/map.js';
import { WONDERS } from '../src/data/wonders.js';

test('marker descriptor carries stable styling and non-color status text', () => {
  const descriptor = markerDescriptor(WONDERS[0], 'en');
  assert.equal(descriptor.id, 'statue-zeus-olympia');
  assert.equal(descriptor.className, 'wonder-marker wonder-marker--lost');
  assert.match(descriptor.label, /Lost/);
  assert.equal(descriptor.coordinates.length, 2);
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
