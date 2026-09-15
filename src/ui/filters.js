import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, t } from '../i18n.js';
import { MAP_CATEGORY_LABELS } from '../core/catalog.js';
import { escapeHtml } from './render.js';

const LABELS_BY_FACET = {
  category: CATEGORY_LABELS,
  country: COUNTRY_LABELS,
  status: STATUS_LABELS,
  mapCategory: MAP_CATEGORY_LABELS
};

const MAP_CATEGORY_COLORS = {
  extant: '#0d9488',
  ruins: '#ea580c',
  lost: '#b91c1c'
};

export function facetOptionLabel(facet, value, language) {
  if (facet === 'sevenWonder') return t(language, 'sevenOnly');
  return LABELS_BY_FACET[facet]?.[value]?.[language] ?? value;
}

export function createFacetOptionsMarkup({ facet, language, options, selectedValue = '' }) {
  const maximum = Math.max(1, ...options.map(({ count }) => count));

  return options.map(({ value, count }) => {
    const selected = value === selectedValue;
    const share = Math.round((count / maximum) * 100);
    const label = facetOptionLabel(facet, value, language);
    const disabled = count === 0 && !selected ? ' disabled' : '';
    const color = (facet === 'mapCategory' && MAP_CATEGORY_COLORS[value]) ? MAP_CATEGORY_COLORS[value] : null;
    const dot = color ? `<span class="facet-option-dot" style="background:${color}" aria-hidden="true"></span>` : '';

    return `<button class="facet-option${selected ? ' is-selected' : ''}" type="button" data-filter-key="${escapeHtml(facet)}" data-filter-value="${escapeHtml(value)}" aria-pressed="${selected}"${disabled} style="--facet-share: ${share}%">
      ${dot}<span class="facet-option-label">${escapeHtml(label)}</span>
      <span class="facet-option-count">${count}</span>
      <i aria-hidden="true"></i>
    </button>`;
  }).join('');
}
