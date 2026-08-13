import { CATEGORY_LABELS, COUNTRY_LABELS, STATUS_LABELS, t } from '../i18n.js';
import { escapeHtml } from './render.js';

const LABELS_BY_FACET = {
  category: CATEGORY_LABELS,
  country: COUNTRY_LABELS,
  status: STATUS_LABELS
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

    return `<button class="facet-option${selected ? ' is-selected' : ''}" type="button" data-filter-key="${escapeHtml(facet)}" data-filter-value="${escapeHtml(value)}" aria-pressed="${selected}"${disabled} style="--facet-share: ${share}%">
      <span class="facet-option-label">${escapeHtml(label)}</span>
      <span class="facet-option-count">${count}</span>
      <i aria-hidden="true"></i>
    </button>`;
  }).join('');
}
