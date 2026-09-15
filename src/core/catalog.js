export function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .toLocaleLowerCase()
    .trim();
}

export const MAP_CATEGORY_KEYS = ['extant', 'ruins', 'lost'];

export const MAP_CATEGORY_LABELS = {
  extant: { en: 'Standing / restored', el: 'Όρθιο / αναστηλωμένο' },
  ruins: { en: 'Ruins / excavated', el: 'Ερείπια / ανασκαμμένο' },
  lost: { en: 'Lost / submerged', el: 'Χαμένο / βυθισμένο' }
};

export const SURVIVAL_GROUP_BY_STATUS = {
  standing: 'extant',
  restored: 'extant',
  'partly-standing': 'extant',
  'partly-restored': 'extant',
  ruins: 'ruins',
  excavated: 'ruins',
  're-erected': 'altered',
  unfinished: 'altered',
  lost: 'lost',
  destroyed: 'lost',
  submerged: 'lost'
};

export const MAP_CATEGORY_BY_STATUS = {
  standing: 'extant',
  restored: 'extant',
  'partly-standing': 'extant',
  'partly-restored': 'extant',
  ruins: 'ruins',
  excavated: 'ruins',
  're-erected': 'ruins',
  unfinished: 'ruins',
  lost: 'lost',
  destroyed: 'lost',
  submerged: 'lost'
};

export function getWonderMapCategoryKey(status) {
  return MAP_CATEGORY_BY_STATUS[status] || 'ruins';
}

export function filterWonders(records, state = {}) {
  const query = normalizeSearchText(state.query);

  return records.filter((record) => {
    const searchable = normalizeSearchText([
      record.name.en,
      record.name.el,
      record.location.en,
      record.location.el,
      record.description.en,
      record.description.el,
      record.period.en,
      record.period.el
    ].join(' '));

    const wonderMapCat = record.mapCategory || getWonderMapCategoryKey(record.status);

    return (!query || searchable.includes(query))
      && (!state.category || record.category === state.category)
      && (!state.country || record.country === state.country)
      && (!state.status || record.status === state.status || wonderMapCat === state.status)
      && (!state.mapCategory || wonderMapCat === state.mapCategory)
      && (state.sevenWonder !== true || record.sevenWonder === true);
  });
}

export function uniqueValues(records, key) {
  if (key === 'mapCategory') {
    return MAP_CATEGORY_KEYS.slice();
  }
  return [...new Set(records.map((record) => record[key]).filter(Boolean))].sort();
}

export function facetCounts(records, state = {}, facet) {
  const clearedState = {
    ...state,
    [facet]: facet === 'sevenWonder' ? false : ''
  };
  const available = filterWonders(records, clearedState);

  if (facet === 'sevenWonder') {
    return [{ value: '1', count: available.filter(({ sevenWonder }) => sevenWonder).length }];
  }

  return uniqueValues(records, facet).map((value) => ({
    value,
    count: available.filter((record) => {
      if (facet === 'mapCategory') {
        const cat = record.mapCategory || getWonderMapCategoryKey(record.status);
        return cat === value;
      }
      return record[facet] === value;
    }).length
  }));
}

export function summarizeSurvival(records) {
  return records.reduce((summary, record) => {
    const group = SURVIVAL_GROUP_BY_STATUS[record.status] ?? 'ruins';
    summary[group] += 1;
    return summary;
  }, { extant: 0, ruins: 0, altered: 0, lost: 0 });
}
