export function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .toLocaleLowerCase()
    .trim();
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

    return (!query || searchable.includes(query))
      && (!state.category || record.category === state.category)
      && (!state.country || record.country === state.country)
      && (!state.status || record.status === state.status)
      && (state.sevenWonder !== true || record.sevenWonder === true);
  });
}

export function uniqueValues(records, key) {
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
    count: available.filter((record) => record[facet] === value).length
  }));
}

const SURVIVAL_GROUP_BY_STATUS = {
  standing: 'extant',
  restored: 'extant',
  'partly-standing': 'extant',
  'partly-restored': 'extant',
  ruins: 'ruins',
  excavated: 'ruins',
  're-erected': 'altered',
  unfinished: 'altered',
  lost: 'lost'
};

export function summarizeSurvival(records) {
  return records.reduce((summary, record) => {
    const group = SURVIVAL_GROUP_BY_STATUS[record.status] ?? 'ruins';
    summary[group] += 1;
    return summary;
  }, { extant: 0, ruins: 0, altered: 0, lost: 0 });
}
