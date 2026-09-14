import test from 'node:test';
import assert from 'node:assert/strict';
import { clampZoom, calculatePanBounds, getDownloadFilename } from '../src/ui/lightbox.js';

test('clampZoom constrains scale between min and max bounds', () => {
  assert.equal(clampZoom(0.5, 1, 4), 1);
  assert.equal(clampZoom(1.5, 1, 4), 1.5);
  assert.equal(clampZoom(4.8, 1, 4), 4);
  assert.equal(clampZoom(2.33333, 1, 4), 2.33);
});

test('calculatePanBounds returns zero bounds at scale <= 1', () => {
  const bounds = calculatePanBounds(1, 1000, 800, 1920, 1080);
  assert.deepEqual(bounds, { minX: 0, maxX: 0, minY: 0, maxY: 0 });
});

test('calculatePanBounds scales pan boundaries proportionally when zoomed', () => {
  const bounds = calculatePanBounds(2, 1000, 800, 1000, 800);
  assert.equal(bounds.maxX, 500);
  assert.equal(bounds.minX, -500);
  assert.equal(bounds.maxY, 400);
  assert.equal(bounds.minY, -400);
});

test('getDownloadFilename formats semantic filenames from asset and wonder id', () => {
  const asset1 = { src: './assets/images/parthenon/hero-1920.webp' };
  assert.equal(getDownloadFilename(asset1, 'parthenon', 0), 'parthenon-hero-1920.webp');

  const asset2 = { src: './assets/images/parthenon/gallery-1-1920.webp' };
  assert.equal(getDownloadFilename(asset2, 'parthenon', 1), 'parthenon-gallery-1-1920.webp');

  const assetFallback = { src: '' };
  assert.equal(getDownloadFilename(assetFallback, 'parthenon', 2), 'parthenon-view-3.webp');
});
