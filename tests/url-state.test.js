import test from 'node:test';
import assert from 'node:assert/strict';

import { WONDERS } from '../src/data/wonders.js';
import { parseUrlState, serializeUrlState } from '../src/core/url-state.js';

test('URL state restores valid language, tab, search and filters', () => {
  const state = parseUrlState('?lang=el&tab=search&q=%CE%94%CE%AF%CE%B1%CF%82&category=temple&country=Greece&status=ruins&seven=1&wonder=parthenon', WONDERS);

  assert.deepEqual(state, {
    language: 'el',
    activeTab: 'search',
    query: 'Δίας',
    category: 'temple',
    country: 'Greece',
    status: 'ruins',
    sevenWonder: true,
    selectedId: 'parthenon'
  });
});

test('URL state rejects unknown enum values and stale monument ids', () => {
  const state = parseUrlState('?lang=xx&tab=broken&category=spaceship&country=Atlantis&status=missing&wonder=not-real', WONDERS);

  assert.deepEqual(state, {
    language: 'en',
    activeTab: 'explore',
    query: '',
    category: '',
    country: '',
    status: '',
    sevenWonder: false,
    selectedId: null
  });
});

test('URL serialization omits defaults and preserves meaningful state', () => {
  const params = serializeUrlState({
    language: 'el', activeTab: 'about', query: 'Rhodes', category: '', country: 'Greece',
    status: '', sevenWonder: false, selectedId: 'colossus-rhodes'
  });

  assert.equal(params.toString(), 'lang=el&tab=about&q=Rhodes&country=Greece&wonder=colossus-rhodes');
  assert.equal(serializeUrlState({}).toString(), '');
});
