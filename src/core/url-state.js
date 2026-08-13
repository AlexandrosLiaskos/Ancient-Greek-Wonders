const TABS = new Set(['browse', 'filters', 'search', 'about']);

export function parseUrlState(search = '', records = []) {
  const params = new URLSearchParams(search);
  const valid = (key, value) => !value || records.some((record) => record[key] === value) ? value : '';
  const selectedId = params.get('wonder');
  const requestedTab = params.get('tab');
  const activeTab = requestedTab === 'explore' ? 'browse' : requestedTab;

  return {
    language: params.get('lang') === 'el' ? 'el' : 'en',
    activeTab: TABS.has(activeTab) ? activeTab : 'browse',
    query: params.get('q') ?? '',
    category: valid('category', params.get('category') ?? ''),
    country: valid('country', params.get('country') ?? ''),
    status: valid('status', params.get('status') ?? ''),
    sevenWonder: params.get('seven') === '1',
    selectedId: records.some((record) => record.id === selectedId) ? selectedId : null
  };
}

export function serializeUrlState(state = {}) {
  const params = new URLSearchParams();
  if (state.language === 'el') params.set('lang', 'el');
  if (state.activeTab && !['browse', 'explore'].includes(state.activeTab)) params.set('tab', state.activeTab);
  if (state.query) params.set('q', state.query);
  if (state.category) params.set('category', state.category);
  if (state.country) params.set('country', state.country);
  if (state.status) params.set('status', state.status);
  if (state.sevenWonder) params.set('seven', '1');
  if (state.selectedId) params.set('wonder', state.selectedId);
  return params;
}
