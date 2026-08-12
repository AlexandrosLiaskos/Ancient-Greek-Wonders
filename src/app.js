import { WONDERS } from './data/wonders.js';
import { filterWonders, uniqueValues } from './core/catalog.js';
import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, localizeRecord, t } from './i18n.js';
import { createDetailMarkup, createResultMarkup } from './ui/render.js';
import { createWondersMap } from './map/map.js';

const params = new URLSearchParams(location.search);
const state = {
  language: params.get('lang') === 'el' ? 'el' : 'en', query: '', category: '', country: '', status: '', sevenWonder: false,
  selectedId: params.get('wonder') || null, activeTab: 'explore'
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  language: $('#language-toggle'), sidebar: $('#sidebar'), mobileMenu: $('#mobile-menu'), catalogToggle: $('#catalog-toggle'),
  search: $('#search-input'), category: $('#category-filter'), country: $('#country-filter'), status: $('#status-filter'), seven: $('#seven-filter'),
  resultList: $('#result-list'), resultCount: $('#result-count'), mapCount: $('#map-count'), empty: $('#empty-state'), activeFilters: $('#active-filters'),
  dialog: $('#detail-dialog'), detail: $('#detail-content'), detailClose: $('#detail-close'), fallback: $('#map-fallback')
};

let mapController = null;
let currentRecords = WONDERS;

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
  const next = new URLSearchParams();
  if (state.language === 'el') next.set('lang', 'el');
  if (state.selectedId) next.set('wonder', state.selectedId);
  history.replaceState({}, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
}

function updateTranslations() {
  document.documentElement.lang = state.language;
  document.title = state.language === 'el' ? 'Θαύματα του Αρχαίου Ελληνικού Κόσμου' : 'Wonders of the Ancient Greek World';
  $('#masthead-title').innerHTML = state.language === 'el'
    ? '<span>Θαύματα</span> <i>του Αρχαίου Ελληνικού Κόσμου</i>'
    : '<span>Wonders</span> <i>of the Ancient Greek World</i>';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(state.language, node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(state.language, node.dataset.i18nPlaceholder); });
  elements.language.textContent = t(state.language, 'language');
  elements.language.setAttribute('aria-label', state.language === 'en' ? 'Switch to Greek' : 'Μετάβαση στα Αγγλικά');
  elements.mobileMenu.setAttribute('aria-label', elements.sidebar.classList.contains('is-open') ? t(state.language, 'closeCatalog') : t(state.language, 'openCatalog'));
  elements.sidebar.setAttribute('aria-label', t(state.language, 'catalogControls'));
  document.querySelector('.tool-rail').setAttribute('aria-label', t(state.language, 'sections'));
  document.querySelector('.map-stage').setAttribute('aria-label', t(state.language, 'mapLabel'));
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
  if (state.category) chips.push(CATEGORY_LABELS[state.category][state.language]);
  if (state.country) chips.push(COUNTRY_LABELS[state.country][state.language]);
  if (state.status) chips.push(STATUS_LABELS[state.status][state.language]);
  if (state.sevenWonder) chips.push(t(state.language, 'sevenOnly'));
  elements.activeFilters.innerHTML = chips.map((chip) => `<span>${chip}</span>`).join('');
}

function render() {
  currentRecords = filterWonders(WONDERS, state);
  elements.resultList.innerHTML = currentRecords.map((record) => createResultMarkup(record, state.language)).join('');
  elements.resultCount.textContent = `${currentRecords.length} ${t(state.language, 'results')}`;
  elements.mapCount.textContent = currentRecords.length;
  elements.empty.hidden = currentRecords.length !== 0;
  elements.resultList.hidden = currentRecords.length === 0;
  renderActiveFilters();
  mapController?.update(currentRecords, state.language);
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.rail-button').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const active = panel.dataset.panel === tab;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
  if (tab === 'search') setTimeout(() => elements.search.focus(), 0);
}

function openDetails(id, focusMap = false) {
  const record = WONDERS.find((item) => item.id === id);
  if (!record) return;
  state.selectedId = record.id;
  elements.detail.innerHTML = createDetailMarkup(record, state.language);
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
  render();
}

document.querySelectorAll('.rail-button').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
elements.language.addEventListener('click', () => {
  state.language = state.language === 'en' ? 'el' : 'en';
  updateTranslations(); render();
  if (state.selectedId && elements.dialog.open) openDetails(state.selectedId);
  syncUrl();
});
elements.search.addEventListener('input', (event) => { state.query = event.target.value; render(); });
for (const key of ['category', 'country', 'status']) elements[key].addEventListener('change', (event) => { state[key] = event.target.value; render(); });
elements.seven.addEventListener('change', (event) => { state.sevenWonder = event.target.checked; render(); });
$('#reset-filters').addEventListener('click', resetFilters);
$('#empty-reset').addEventListener('click', resetFilters);
elements.resultList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-wonder-id]');
  if (button) openDetails(button.dataset.wonderId, true);
});
elements.detailClose.addEventListener('click', () => elements.dialog.close());
elements.dialog.addEventListener('click', (event) => { if (event.target === elements.dialog) elements.dialog.close(); });
elements.dialog.addEventListener('close', () => { state.selectedId = null; syncUrl(); });

function toggleSidebar(force) {
  const open = typeof force === 'boolean' ? force : !elements.sidebar.classList.contains('is-open');
  elements.sidebar.classList.toggle('is-open', open);
  elements.mobileMenu.setAttribute('aria-expanded', String(open));
  elements.mobileMenu.setAttribute('aria-label', t(state.language, open ? 'closeCatalog' : 'openCatalog'));
  setTimeout(() => mapController?.invalidateSize(), 220);
}
elements.mobileMenu.addEventListener('click', () => toggleSidebar());
elements.catalogToggle.addEventListener('click', () => toggleSidebar(true));

updateTranslations();
render();

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
}

if (state.selectedId) requestAnimationFrame(() => openDetails(state.selectedId, true));
