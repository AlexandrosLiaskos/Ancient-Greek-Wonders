import test from 'node:test';
import assert from 'node:assert/strict';

import { clampGalleryIndex, galleryIndexFromScroll } from '../src/ui/gallery.js';

test('gallery navigation clamps at the first and last image', () => {
  assert.equal(clampGalleryIndex(0, -1, 3), 0);
  assert.equal(clampGalleryIndex(0, 1, 3), 1);
  assert.equal(clampGalleryIndex(2, 1, 3), 2);
});

test('gallery scroll position resolves to the nearest slide', () => {
  assert.equal(galleryIndexFromScroll(0, 960, 3), 0);
  assert.equal(galleryIndexFromScroll(510, 960, 3), 1);
  assert.equal(galleryIndexFromScroll(4000, 960, 3), 2);
});
