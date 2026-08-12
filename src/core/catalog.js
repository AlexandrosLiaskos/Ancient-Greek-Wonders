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
