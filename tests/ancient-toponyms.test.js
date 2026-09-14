import test from 'node:test';
import assert from 'node:assert/strict';
import { ANCIENT_TOPONYMS } from '../src/data/ancient-toponyms.js';
import { isBoxColliding, filterToponymsByZoom, estimateToponymBox } from '../src/map/ancient-toponyms-layer.js';

test('ancient toponyms dataset contains zero transient empires or political kingdoms', () => {
  const forbiddenPatterns = [
    /\bempire\b/i,
    /\bαυτοκρατορία\b/i,
    /\bkingdom\b/i,
    /\bβασίλειο\b/i,
    /\bachaemenid\b/i,
    /\bachaemenian\b/i,
    /\bseleucid\b/i,
    /\bptolemaic empire\b/i,
    /\broman empire\b/i,
    /\bathenian empire\b/i
  ];

  for (const item of ANCIENT_TOPONYMS) {
    for (const pattern of forbiddenPatterns) {
      assert.strictEqual(
        pattern.test(item.id) || pattern.test(item.name.en) || pattern.test(item.name.el),
        false,
        `Toponym "${item.id}" (${item.name.en} / ${item.name.el}) contains forbidden political empire designation matching ${pattern}`
      );
    }
  }
});

test('ancient toponyms have complete bilingual names and valid ecumene coordinates', () => {
  assert.ok(ANCIENT_TOPONYMS.length >= 150, `Expected at least 150 toponyms, found ${ANCIENT_TOPONYMS.length}`);

  const ids = new Set();
  for (const item of ANCIENT_TOPONYMS) {
    assert.ok(item.id && typeof item.id === 'string', 'Item has valid id');
    assert.ok(!ids.has(item.id), `Duplicate toponym id: ${item.id}`);
    ids.add(item.id);

    assert.ok(item.name?.en && typeof item.name.en === 'string', `Missing English name for ${item.id}`);
    assert.ok(item.name?.el && typeof item.name.el === 'string', `Missing Greek name for ${item.id}`);

    // Geographic bounds: Full ancient ecumene from Atlantic/British Isles to Central Asia/India/China
    assert.ok(item.lat >= -5.0 && item.lat <= 68.0, `Latitude ${item.lat} out of range for ${item.id}`);
    assert.ok(item.lng >= -15.0 && item.lng <= 105.0, `Longitude ${item.lng} out of range for ${item.id}`);
    assert.ok(Number.isFinite(item.minZoom) && item.minZoom >= 3 && item.minZoom <= 10, `Invalid minZoom for ${item.id}`);
  }
});

test('toponym filtering exhibits progressive disclosure across zoom levels', () => {
  const atZoom3 = filterToponymsByZoom(ANCIENT_TOPONYMS, 3);
  const atZoom5 = filterToponymsByZoom(ANCIENT_TOPONYMS, 5);
  const atZoom7 = filterToponymsByZoom(ANCIENT_TOPONYMS, 7);
  const atZoom9 = filterToponymsByZoom(ANCIENT_TOPONYMS, 9);
  const atZoom10 = filterToponymsByZoom(ANCIENT_TOPONYMS, 10);

  // Active labels scale up dramatically as the map zooms in
  assert.ok(atZoom3.length > 0 && atZoom3.length <= 35, `Zoom 3 should show modest count, got ${atZoom3.length}`);
  assert.ok(atZoom5.length > atZoom3.length, 'Zoom 5 should show more than Zoom 3');
  assert.ok(atZoom7.length > atZoom5.length, 'Zoom 7 should show more than Zoom 5');
  assert.ok(atZoom9.length > atZoom7.length, 'Zoom 9 should show more than Zoom 7');
  assert.ok(atZoom10.length > atZoom9.length, 'Zoom 10 should show more than Zoom 9');
  assert.ok(atZoom10.length >= 200, `Zoom 10 should reveal rich density ("more and more and more"), got ${atZoom10.length}`);

  // Cumulative introduced features increase monotonically across all zoom levels
  const cumulativeCount = (zoom) => ANCIENT_TOPONYMS.filter((item) => item.minZoom <= zoom).length;
  assert.ok(cumulativeCount(4) >= cumulativeCount(3));
  assert.ok(cumulativeCount(6) > cumulativeCount(4));
  assert.ok(cumulativeCount(8) > cumulativeCount(6));
  assert.ok(cumulativeCount(10) > cumulativeCount(8));
  assert.ok(cumulativeCount(10) >= 250, 'Total cumulative features reaches rich coverage');
});

test('bounding box collision detector correctly flags overlaps and clearances', () => {
  const box1 = { x1: 100, y1: 100, x2: 150, y2: 120 };
  const overlapping = { x1: 140, y1: 110, x2: 180, y2: 130 };
  const clearHorizontal = { x1: 160, y1: 100, x2: 200, y2: 120 };
  const clearVertical = { x1: 100, y1: 130, x2: 150, y2: 150 };

  assert.strictEqual(isBoxColliding(box1, overlapping, 2), true);
  assert.strictEqual(isBoxColliding(box1, clearHorizontal, 2), false);
  assert.strictEqual(isBoxColliding(box1, clearVertical, 2), false);
});
