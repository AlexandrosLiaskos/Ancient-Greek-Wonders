import { WONDERS } from './data/wonders.js';
import { filterWonders, uniqueValues } from './core/catalog.js';
import { parseUrlState, serializeUrlState } from './core/url-state.js';
import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, formatResultCount, t } from './i18n.js';
import { createDetailMarkup, createResultMarkup } from './ui/render.js';
import { initializeGallery } from './ui/gallery.js';
import { createWondersMap } from './map/map.js';

const state = parseUrlState(location.search, WONDERS);

const $ = (selector) => document.querySelector(selector);
const elements = {
  language: $('#language-toggle'), sidebar: $('#sidebar'), mobileMenu: $('#mobile-menu'), catalogToggle: $('#catalog-toggle'),
  search: $('#search-input'), category: $('#category-filter'), country: $('#country-filter'), status: $('#status-filter'), seven: $('#seven-filter'),
  resultList: $('#result-list'), resultCount: $('#result-count'), mapCount: $('#map-count'), empty: $('#empty-state'), activeFilters: $('#active-filters'),
  dialog: $('#detail-dialog'), detail: $('#detail-content'), detailClose: $('#detail-close'), fallback: $('#map-fallback'),
  mapStage: $('.map-stage'), legend: $('.legend'), scrim: $('#sidebar-scrim'), metaDescription: $('#meta-description'),
  sheetClose: $('#sheet-close'), catalogRegister: $('#catalog-register'), previewRegion: $('#map-preview-region')
};

let mapController = null;
let currentRecords = WONDERS;
let sidebarOpener = null;
let detailGallery = null;
const mobileQuery = globalThis.matchMedia('(max-width: 760px)');

function setOptions(select, values, labels) {
  select.innerHTML = `<option value="">${t(state.language, 'all')}</option>` + values.map((value) => `<option value="${value}">${labels[value]?.[state.language] ?? value}</option>`).join('');
}

function populateFilters() {
  const selected = { category: state.category, country: state.country, status: state.status };
  setOptions(elements.category, uniqueValues(WONDERS, 'category'), CATEGORY_LABELS);
  setOptions(elements.country, uniqueValues(WONDERS, 'country'), COUNTRY_LABELS);
  setOptions(elements.status, uniqueValues(WONDERS, 'status'), STATUS_LABELS);
  Object.entries(selected).forEach(([key, value]) => { elements[key].value = value; });
}

function syncUrl() {
  const next = serializeUrlState(state);
  history.replaceState({}, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
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
  elements.mobileMenu.setAttribute('aria-label', elements.sidebar.classList.contains('is-open') ? t(state.language, 'closeCatalog') : t(state.language, 'openCatalog'));
  elements.sidebar.setAttribute('aria-label', t(state.language, 'catalogControls'));
  document.querySelector('.tool-rail').setAttribute('aria-label', t(state.language, 'sections'));
  document.querySelector('.map-stage').setAttribute('aria-label', t(state.language, 'mapLabel'));
  elements.legend.setAttribute('aria-label', t(state.language, 'legendLabel'));
  elements.scrim.setAttribute('aria-label', t(state.language, 'closeCatalog'));
  elements.catalogToggle.setAttribute('aria-label', t(state.language, 'openCatalog'));
  const tabKeys = { explore: 'explore', search: 'searchTab', about: 'about' };
  document.querySelectorAll('.rail-button').forEach((button) => button.setAttribute('aria-label', t(state.language, tabKeys[button.dataset.tab])));
  const legend = {
    extant: state.language === 'el' ? 'Όρθιο / αναστηλωμένο' : 'Standing / restored',
    ruins: state.language === 'el' ? 'Ερείπια / ανασκαμμένο' : 'Ruins / excavated',
    lost: state.language === 'el' ? 'Χαμένο' : 'Lost'
  };
  Object.entries(legend).forEach(([key, value]) => { document.querySelector(`[data-legend="${key}"]`).textContent = value; });
  populateFilters();
}

function renderActiveFilters() {
  const chips = [];
  if (state.category) chips.push(['category', CATEGORY_LABELS[state.category][state.language]]);
  if (state.country) chips.push(['country', COUNTRY_LABELS[state.country][state.language]]);
  if (state.status) chips.push(['status', STATUS_LABELS[state.status][state.language]]);
  if (state.sevenWonder) chips.push(['sevenWonder', t(state.language, 'sevenOnly')]);
  elements.activeFilters.innerHTML = chips.map(([key, label]) => `<button type="button" data-clear-filter="${key}" aria-label="${t(state.language, 'removeFilter')}: ${label}"><span>${label}</span><b aria-hidden="true">×</b></button>`).join('');
}

function render() {
  currentRecords = filterWonders(WONDERS, state);
  elements.resultList.innerHTML = currentRecords.map((record) => createResultMarkup(record, state.language)).join('');
  elements.resultCount.textContent = formatResultCount(state.language, currentRecords.length);
  elements.mapCount.textContent = currentRecords.length;
  elements.empty.hidden = currentRecords.length !== 0;
  elements.resultList.hidden = currentRecords.length === 0;
  renderActiveFilters();
  mapController?.update(currentRecords, state.language);
}

function renderAndSync() {
  render();
  syncUrl();
}

function setTab(tab, { focusSearch = true, sync = true } = {}) {
  state.activeTab = tab;
  document.querySelectorAll('.rail-button').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const active = panel.dataset.panel === tab;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
  elements.catalogRegister.hidden = tab === 'about';
  document.querySelectorAll('[data-mobile-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.mobileTab === tab));
  if (tab === 'search' && focusSearch) setTimeout(() => elements.search.focus(), 0);
  if (sync) syncUrl();
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
  elements.category.value = '';
  elements.country.value = '';
  elements.status.value = '';
  elements.seven.checked = false;
  renderAndSync();
}

const tabButtons = [...document.querySelectorAll('.rail-button')];
tabButtons.forEach((button) => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = tabButtons.indexOf(button);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabButtons.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + tabButtons.length) % tabButtons.length;
    const next = tabButtons[nextIndex];
    next.focus();
    setTab(next.dataset.tab, { focusSearch: false });
  });
});
elements.language.addEventListener('click', () => {
  state.language = state.language === 'en' ? 'el' : 'en';
  updateTranslations(); render();
  if (state.selectedId && elements.dialog.open) openDetails(state.selectedId);
  syncUrl();
});
elements.search.addEventListener('input', (event) => { state.query = event.target.value; renderAndSync(); });
for (const key of ['category', 'country', 'status']) elements[key].addEventListener('change', (event) => { state[key] = event.target.value; renderAndSync(); });
elements.seven.addEventListener('change', (event) => { state.sevenWonder = event.target.checked; renderAndSync(); });
elements.activeFilters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-clear-filter]');
  if (!button) return;
  const key = button.dataset.clearFilter;
  state[key] = key === 'sevenWonder' ? false : '';
  if (key === 'sevenWonder') elements.seven.checked = false;
  else elements[key].value = '';
  renderAndSync();
});
$('#reset-filters').addEventListener('click', resetFilters);
$('#empty-reset').addEventListener('click', resetFilters);
elements.resultList.addEventListener('click', (event) => {
  const item = event.target.closest('[data-wonder-id]');
  const action = event.target.closest('[data-result-action]');
  if (!item || !action) return;
  const record = WONDERS.find((candidate) => candidate.id === item.dataset.wonderId);
  if (!record) return;
  if (action.dataset.resultAction === 'details') openDetails(record.id, true);
  else {
    mapController?.focus(record, { openPreview: true });
    elements.previewRegion.textContent = `${record.name[state.language]}, ${record.location[state.language]}`;
    if (mobileQuery.matches) toggleSidebar(false);
  }
});
elements.detailClose.addEventListener('click', () => elements.dialog.close());
elements.dialog.addEventListener('click', (event) => { if (event.target === elements.dialog) elements.dialog.close(); });
elements.dialog.addEventListener('close', () => { state.selectedId = null; syncUrl(); });

function toggleSidebar(force) {
  if (!mobileQuery.matches) return;
  const open = typeof force === 'boolean' ? force : !elements.sidebar.classList.contains('is-open');
  if (open) sidebarOpener = document.activeElement;
  elements.sidebar.classList.toggle('is-open', open);
  elements.sidebar.toggleAttribute('inert', !open);
  elements.sidebar.setAttribute('aria-hidden', String(!open));
  elements.mapStage.toggleAttribute('inert', open);
  if (open) elements.mapStage.setAttribute('aria-hidden', 'true');
  else elements.mapStage.removeAttribute('aria-hidden');
  elements.scrim.hidden = !open;
  elements.mobileMenu.setAttribute('aria-expanded', String(open));
  elements.mobileMenu.setAttribute('aria-label', t(state.language, open ? 'closeCatalog' : 'openCatalog'));
  elements.catalogToggle.setAttribute('aria-expanded', String(open));
  if (open) {
    requestAnimationFrame(() => tabButtons.find((button) => button.dataset.tab === state.activeTab)?.focus());
  } else if (sidebarOpener instanceof HTMLElement) {
    sidebarOpener.focus();
  }
  const delay = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
  setTimeout(() => mapController?.invalidateSize(), delay);
}
elements.mobileMenu.addEventListener('click', () => toggleSidebar());
elements.catalogToggle.addEventListener('click', () => toggleSidebar(true));
elements.sheetClose.addEventListener('click', () => toggleSidebar(false));
document.querySelectorAll('[data-mobile-tab]').forEach((button) => button.addEventListener('click', () => {
  setTab(button.dataset.mobileTab);
  toggleSidebar(true);
}));
elements.scrim.addEventListener('click', () => toggleSidebar(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && elements.sidebar.classList.contains('is-open') && !elements.dialog.open) toggleSidebar(false);
  if (elements.dialog.open && event.key === 'ArrowLeft') detailGallery?.move(-1);
  if (elements.dialog.open && event.key === 'ArrowRight') detailGallery?.move(1);
});
mobileQuery.addEventListener('change', ({ matches }) => {
  if (matches) {
    toggleSidebar(false);
  } else {
    elements.sidebar.classList.remove('is-open');
    elements.sidebar.removeAttribute('inert');
    elements.sidebar.removeAttribute('aria-hidden');
    elements.mapStage.removeAttribute('inert');
    elements.mapStage.removeAttribute('aria-hidden');
    elements.scrim.hidden = true;
    elements.mobileMenu.setAttribute('aria-expanded', 'false');
    elements.catalogToggle.setAttribute('aria-expanded', 'false');
    mapController?.invalidateSize();
  }
});

updateTranslations();
elements.search.value = state.query;
elements.seven.checked = state.sevenWonder;
setTab(state.activeTab, { focusSearch: false, sync: false });
if (mobileQuery.matches) toggleSidebar(false);
render();
syncUrl();

try {
  mapController = createWondersMap($('#map'), currentRecords, { language: state.language, onSelect: (id) => openDetails(id) });
  mapController.map.on('mousemove', ({ latlng }) => {
    document.querySelector('.map-status span:last-child').textContent = `${latlng.lat.toFixed(2)}° N · ${latlng.lng.toFixed(2)}° E`;
  });
} catch (error) {
  console.error(error);
  elements.fallback.hidden = false;
  $('#map').classList.add('is-unavailable');
  setTab('search');
  if (mobileQuery.matches) toggleSidebar(true);
}

if (state.selectedId) requestAnimationFrame(() => openDetails(state.selectedId, true));
