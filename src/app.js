import { WONDERS } from './data/wonders.js';
import { facetCounts, filterWonders, normalizeSearchText, summarizeSurvival } from './core/catalog.js';
import { parseUrlState, serializeUrlState } from './core/url-state.js';
import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, formatResultCount, t } from './i18n.js';
import { createDetailMarkup, createResultMarkup } from './ui/render.js';
import { createFacetOptionsMarkup, facetOptionLabel } from './ui/filters.js';
import { initializeGallery } from './ui/gallery.js';
import { createWondersMap } from './map/map.js';

const state = parseUrlState(location.search, WONDERS);
const $ = (selector) => document.querySelector(selector);
const elements = {
  language: $('#language-toggle'),
  aboutButton: $('#about-button'),
  sidebar: $('#sidebar'),
  sheetClose: $('#sheet-close'),
  search: $('#search-input'),
  facetSearch: $('#facet-search-input'),
  facetSearchShell: $('.facet-search'),
  facetOptions: $('#facet-options'),
  facetEmpty: $('#facet-empty'),
  activeFilters: $('#active-filters'),
  activeFilterCount: $('#active-filter-count'),
  filterBadge: $('#filter-badge'),
  mobileFilterBadge: $('#mobile-filter-badge'),
  resultList: $('#result-list'),
  searchResultList: $('#search-result-list'),
  catalogRegister: $('#catalog-register'),
  searchRegister: $('.search-register'),
  resultCount: $('#result-count'),
  searchResultCount: $('#search-result-count'),
  mapCount: $('#map-count'),
  empty: $('#empty-state'),
  searchEmpty: $('#search-empty-state'),
  dialog: $('#detail-dialog'),
  detail: $('#detail-content'),
  detailClose: $('#detail-close'),
  fallback: $('#map-fallback'),
  mapStage: $('.map-stage'),
  mapLegend: $('#map-legend'),
  legendTotal: $('#legend-total'),
  mobileBar: $('.mobile-action-bar'),
  metaDescription: $('#meta-description'),
  previewRegion: $('#map-preview-region')
};

const primaryViews = new Set(['browse', 'filters', 'search']);
const filterKeys = ['category', 'country', 'status', 'sevenWonder'];
const mobileQuery = globalThis.matchMedia('(max-width: 760px)');
const toolTabs = [...document.querySelectorAll('.tool-tab')];
const facetTabs = [...document.querySelectorAll('.facet-tab')];
let activeFacet = 'category';
let facetQuery = '';
let mapController = null;
let currentRecords = WONDERS;
let sidebarOpener = null;
let detailGallery = null;

function syncUrl() {
  const next = serializeUrlState(state);
  history.replaceState({}, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
}

function countActiveFilters() {
  return filterKeys.reduce((count, key) => count + (state[key] ? 1 : 0), 0);
}

function selectedFacetValue() {
  return activeFacet === 'sevenWonder' ? (state.sevenWonder ? '1' : '') : state[activeFacet];
}

function renderFacetOptions() {
  const normalizedQuery = normalizeSearchText(facetQuery);
  const options = facetCounts(WONDERS, state, activeFacet)
    .filter(({ value }) => !normalizedQuery || normalizeSearchText(facetOptionLabel(activeFacet, value, state.language)).includes(normalizedQuery))
    .sort((a, b) => facetOptionLabel(activeFacet, a.value, state.language).localeCompare(facetOptionLabel(activeFacet, b.value, state.language), state.language));

  elements.facetOptions.innerHTML = createFacetOptionsMarkup({
    facet: activeFacet,
    language: state.language,
    options,
    selectedValue: selectedFacetValue()
  });
  elements.facetOptions.hidden = options.length === 0;
  elements.facetOptions.setAttribute('aria-labelledby', `facet-${activeFacet}`);
  elements.facetEmpty.hidden = options.length !== 0;
  elements.facetSearchShell.hidden = activeFacet === 'sevenWonder';
}

function renderActiveFilters() {
  const chips = [];
  if (state.category) chips.push(['category', CATEGORY_LABELS[state.category][state.language]]);
  if (state.country) chips.push(['country', COUNTRY_LABELS[state.country][state.language]]);
  if (state.status) chips.push(['status', STATUS_LABELS[state.status][state.language]]);
  if (state.sevenWonder) chips.push(['sevenWonder', t(state.language, 'sevenOnly')]);

  elements.activeFilters.innerHTML = chips.map(([key, label]) => `<button type="button" data-clear-filter="${key}" aria-label="${t(state.language, 'removeFilter')}: ${label}"><span>${label}</span><b aria-hidden="true">×</b></button>`).join('');
  const count = countActiveFilters();
  elements.activeFilterCount.textContent = count;
  for (const badge of [elements.filterBadge, elements.mobileFilterBadge]) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
}

function renderLegend() {
  const summary = summarizeSurvival(currentRecords);
  elements.legendTotal.textContent = currentRecords.length;
  Object.entries(summary).forEach(([group, count]) => {
    document.querySelector(`[data-legend-count="${group}"]`).textContent = count;
  });
}

function render() {
  currentRecords = filterWonders(WONDERS, state);
  const markup = currentRecords.map((record) => createResultMarkup(record, state.language)).join('');
  elements.resultList.innerHTML = markup;
  elements.searchResultList.innerHTML = markup;
  elements.resultCount.textContent = formatResultCount(state.language, currentRecords.length);
  elements.searchResultCount.textContent = currentRecords.length;
  elements.mapCount.textContent = currentRecords.length;
  elements.empty.hidden = currentRecords.length !== 0;
  elements.searchEmpty.hidden = currentRecords.length !== 0;
  elements.resultList.hidden = currentRecords.length === 0;
  elements.searchResultList.hidden = currentRecords.length === 0;
  renderActiveFilters();
  renderFacetOptions();
  renderLegend();
  mapController?.update(currentRecords, state.language);
}

function renderAndSync() {
  render();
  syncUrl();
}

function updateTranslations() {
  document.documentElement.lang = state.language;
  document.title = state.language === 'el' ? 'Θαύματα του Αρχαίου Ελληνικού Κόσμου' : 'Wonders of the Ancient Greek World';
  elements.metaDescription.content = t(state.language, 'metaDescription');
  $('#masthead-title').innerHTML = state.language === 'el'
    ? '<span>Θαύματα</span> <i>του Αρχαίου Ελληνικού Κόσμου</i>'
    : '<span>Wonders</span> <i>of the Ancient Greek World</i>';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(state.language, node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(state.language, node.dataset.i18nPlaceholder); });
  elements.language.textContent = t(state.language, 'language');
  elements.language.setAttribute('aria-label', t(state.language, 'languageLabel'));
  elements.aboutButton.setAttribute('aria-label', t(state.language, 'about'));
  elements.sheetClose.setAttribute('aria-label', t(state.language, 'closeCatalog'));
  elements.sidebar.setAttribute('aria-label', t(state.language, 'catalogControls'));
  $('.tool-tabs').setAttribute('aria-label', t(state.language, 'sections'));
  $('.facet-tabs').setAttribute('aria-label', t(state.language, 'filterField'));
  elements.mapStage.setAttribute('aria-label', t(state.language, 'mapLabel'));
  elements.mapLegend.querySelector('[role="group"]').setAttribute('aria-label', t(state.language, 'legendLabel'));
  elements.mobileBar.setAttribute('aria-label', t(state.language, 'sections'));
  elements.catalogRegister.setAttribute('aria-label', t(state.language, 'monuments'));
  elements.searchRegister.setAttribute('aria-label', t(state.language, 'searchResults'));
}

function setView(view, { focusSearch = true, sync = true } = {}) {
  state.activeTab = view;
  toolTabs.forEach((button) => {
    const active = button.dataset.tab === view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('.task-panel').forEach((panel) => {
    const active = panel.dataset.panel === view;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
  document.querySelectorAll('[data-mobile-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.mobileTab === view));
  elements.aboutButton.setAttribute('aria-expanded', String(view === 'about' && (!mobileQuery.matches || elements.sidebar.classList.contains('is-open'))));
  if (view === 'search' && focusSearch) setTimeout(() => elements.search.focus(), 0);
  if (sync) syncUrl();
}

function setFacet(facet, { focus = false } = {}) {
  activeFacet = facet;
  facetQuery = '';
  elements.facetSearch.value = '';
  facetTabs.forEach((button) => {
    const active = button.dataset.facet === facet;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  renderFacetOptions();
}

function openDetails(id, focusMap = false) {
  const record = WONDERS.find((item) => item.id === id);
  if (!record) return;
  state.selectedId = record.id;
  elements.detail.innerHTML = createDetailMarkup(record, state.language);
  detailGallery = initializeGallery(elements.detail);
  elements.detailClose.setAttribute('aria-label', t(state.language, 'close'));
  if (!elements.dialog.open) elements.dialog.showModal();
  if (focusMap) mapController?.focus(record);
  syncUrl();
}

function resetFilters() {
  Object.assign(state, { query: '', category: '', country: '', status: '', sevenWonder: false });
  elements.search.value = '';
  elements.facetSearch.value = '';
  facetQuery = '';
  renderAndSync();
}

function handleResultClick(event) {
  const item = event.target.closest('[data-wonder-id]');
  const action = event.target.closest('[data-result-action]');
  if (!item || !action) return;
  const record = WONDERS.find((candidate) => candidate.id === item.dataset.wonderId);
  if (!record) return;

  if (action.dataset.resultAction === 'details') {
    openDetails(record.id, true);
  } else {
    mapController?.focus(record, { openPreview: true });
    elements.previewRegion.textContent = `${record.name[state.language]}, ${record.location[state.language]}`;
    if (mobileQuery.matches) toggleSidebar(false);
  }
}

function toggleSidebar(force) {
  if (!mobileQuery.matches) return;
  const open = typeof force === 'boolean' ? force : !elements.sidebar.classList.contains('is-open');
  if (open) sidebarOpener = document.activeElement;
  elements.sidebar.classList.toggle('is-open', open);
  elements.sidebar.toggleAttribute('inert', !open);
  elements.sidebar.setAttribute('aria-hidden', String(!open));
  elements.mapStage.toggleAttribute('inert', open);
  elements.mapStage.setAttribute('aria-hidden', String(open));
  elements.mobileBar.toggleAttribute('inert', open);
  elements.mobileBar.setAttribute('aria-hidden', String(open));
  elements.aboutButton.setAttribute('aria-expanded', String(open && state.activeTab === 'about'));

  if (open) {
    requestAnimationFrame(() => elements.sheetClose.focus());
  } else if (sidebarOpener instanceof HTMLElement) {
    sidebarOpener.focus();
  }

  const delay = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
  setTimeout(() => mapController?.invalidateSize(), delay);
}

function moveRovingTab(buttons, currentButton, event, axisKeys) {
  if (![...axisKeys, 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const current = buttons.indexOf(currentButton);
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
    : (current + (event.key === axisKeys[1] ? 1 : -1) + buttons.length) % buttons.length;
  buttons[nextIndex].click();
  buttons[nextIndex].focus();
}

toolTabs.forEach((button) => {
  button.addEventListener('click', (event) => setView(button.dataset.tab, { focusSearch: event.detail > 0 }));
  button.addEventListener('keydown', (event) => moveRovingTab(toolTabs, button, event, ['ArrowLeft', 'ArrowRight']));
});
facetTabs.forEach((button) => {
  button.addEventListener('click', () => setFacet(button.dataset.facet));
  button.addEventListener('keydown', (event) => moveRovingTab(facetTabs, button, event, ['ArrowLeft', 'ArrowRight']));
});

elements.language.addEventListener('click', () => {
  state.language = state.language === 'en' ? 'el' : 'en';
  updateTranslations();
  render();
  if (state.selectedId && elements.dialog.open) openDetails(state.selectedId);
  syncUrl();
});
elements.aboutButton.addEventListener('click', () => {
  setView('about', { focusSearch: false });
  if (mobileQuery.matches) toggleSidebar(true);
});
$('#about-back').addEventListener('click', () => setView('browse', { focusSearch: false }));
elements.search.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderAndSync();
});
elements.facetSearch.addEventListener('input', (event) => {
  facetQuery = event.target.value;
  renderFacetOptions();
});
elements.facetOptions.addEventListener('click', (event) => {
  const option = event.target.closest('[data-filter-key]');
  if (!option) return;
  const { filterKey: key, filterValue: value } = option.dataset;
  if (key === 'sevenWonder') state.sevenWonder = !state.sevenWonder;
  else state[key] = state[key] === value ? '' : value;
  renderAndSync();
});
elements.activeFilters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-clear-filter]');
  if (!button) return;
  const key = button.dataset.clearFilter;
  state[key] = key === 'sevenWonder' ? false : '';
  renderAndSync();
});
$('#reset-filters').addEventListener('click', resetFilters);
$('#empty-reset').addEventListener('click', resetFilters);
$('#search-empty-reset').addEventListener('click', resetFilters);
elements.resultList.addEventListener('click', handleResultClick);
elements.searchResultList.addEventListener('click', handleResultClick);
elements.detailClose.addEventListener('click', () => elements.dialog.close());
elements.dialog.addEventListener('click', (event) => { if (event.target === elements.dialog) elements.dialog.close(); });
elements.dialog.addEventListener('close', () => { state.selectedId = null; syncUrl(); });
elements.sheetClose.addEventListener('click', () => toggleSidebar(false));
document.querySelectorAll('[data-mobile-tab]').forEach((button) => button.addEventListener('click', () => {
  setView(button.dataset.mobileTab, { focusSearch: false });
  toggleSidebar(true);
}));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && elements.sidebar.classList.contains('is-open') && !elements.dialog.open) toggleSidebar(false);
  if (elements.dialog.open && event.key === 'ArrowLeft') detailGallery?.move(-1);
  if (elements.dialog.open && event.key === 'ArrowRight') detailGallery?.move(1);
});

function syncResponsiveState(matches) {
  if (matches) {
    elements.mapLegend.removeAttribute('open');
    toggleSidebar(false);
  } else {
    elements.mapLegend.setAttribute('open', '');
    elements.sidebar.classList.remove('is-open');
    elements.sidebar.removeAttribute('inert');
    elements.sidebar.removeAttribute('aria-hidden');
    elements.mapStage.removeAttribute('inert');
    elements.mapStage.removeAttribute('aria-hidden');
    elements.mobileBar.removeAttribute('inert');
    elements.mobileBar.removeAttribute('aria-hidden');
    mapController?.invalidateSize();
  }
}

mobileQuery.addEventListener('change', ({ matches }) => syncResponsiveState(matches));

updateTranslations();
elements.search.value = state.query;
setView(primaryViews.has(state.activeTab) || state.activeTab === 'about' ? state.activeTab : 'browse', { focusSearch: false, sync: false });
render();
syncResponsiveState(mobileQuery.matches);
syncUrl();

try {
  mapController = createWondersMap($('#map'), currentRecords, { language: state.language, onSelect: (id) => openDetails(id) });
  mapController.map.on('mousemove', ({ latlng }) => {
    $('.map-status span:last-child').textContent = `${latlng.lat.toFixed(2)}° N · ${latlng.lng.toFixed(2)}° E`;
  });
} catch (error) {
  console.error(error);
  elements.fallback.hidden = false;
  $('#map').classList.add('is-unavailable');
  setView('search');
  if (mobileQuery.matches) toggleSidebar(true);
}

if (state.selectedId) requestAnimationFrame(() => openDetails(state.selectedId, true));
