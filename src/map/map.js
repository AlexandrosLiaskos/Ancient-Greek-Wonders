import { formatClusterCount, localizeRecord, t } from '../i18n.js';
import { createMapPreviewMarkup, escapeHtml } from '../ui/render.js';
import { MeasurementTool } from './measurement-tool.js';

export const WONDER_MAP_CATEGORIES = [
  { key: 'extant', label: 'Standing / restored', color: '#059669', border: '#34d399' },
  { key: 'ruins', label: 'Ruins / excavated', color: '#d97706', border: '#fbbf24' },
  { key: 'altered', label: 'Re-erected / unfinished', color: '#2563eb', border: '#60a5fa' },
  { key: 'lost', label: 'Lost / submerged', color: '#dc2626', border: '#f87171' }
];

export const SURVIVAL_GROUP_BY_STATUS = {
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

export function getWonderMapCategory(wonder) {
  const key = SURVIVAL_GROUP_BY_STATUS[wonder?.status] || 'ruins';
  return WONDER_MAP_CATEGORIES.find((cat) => cat.key === key) || WONDER_MAP_CATEGORIES[1];
}

export function getLocalizedWonderCategories(language) {
  if (language === 'el') {
    return [
      { key: 'extant', label: 'Όρθιο / αναστηλωμένο', color: '#059669', border: '#34d399' },
      { key: 'ruins', label: 'Ερείπια / ανεσκαμμένο', color: '#d97706', border: '#fbbf24' },
      { key: 'altered', label: 'Ανοικοδομημένο / ημιτελές', color: '#2563eb', border: '#60a5fa' },
      { key: 'lost', label: 'Χαμένο / βυθισμένο', color: '#dc2626', border: '#f87171' }
    ];
  }
  return WONDER_MAP_CATEGORIES;
}

export function mapControlLabels(language) {
  return { zoomIn: t(language, 'zoomIn'), zoomOut: t(language, 'zoomOut'), layers: t(language, 'mapLayers') };
}

export function markerDescriptor(record, language) {
  const item = localizeRecord(record, language);
  const label = `${item.name} — ${item.statusLabel}`;
  const className = `wonder-marker wonder-marker--${record.status}`;
  return {
    id: record.id,
    name: item.name,
    label,
    className,
    iconMarkup: `<span class="${className}" role="img" aria-label="${escapeHtml(label)}"><i class="wonder-marker-glyph" aria-hidden="true"></i></span>`,
    coordinates: [record.coordinates.lat, record.coordinates.lng],
    location: item.location,
    period: item.period,
    category: item.categoryLabel,
    status: item.statusLabel,
    previewId: record.id
  };
}

export function revealMarkerPreview(cluster, marker) {
  if (!marker) return;
  if (typeof cluster.zoomToShowLayer === 'function') {
    cluster.zoomToShowLayer(marker, () => marker.openPopup());
  } else if (typeof marker.openPopup === 'function') {
    marker.openPopup();
  }
}

export function createWondersMap(element, records, { language = 'en', onSelect = () => {} } = {}) {
  const L = globalThis.L;
  if (!L) throw new Error('Leaflet is unavailable');

  const map = L.map(element, {
    zoomControl: true,
    minZoom: 3,
    maxZoom: 19,
    worldCopyJump: true
  }).setView([37.2, 23.6], 5);

  const baseMaps = globalThis.NkuaWebGISMap?.createBasemaps ? globalThis.NkuaWebGISMap.createBasemaps() : {
    'Carto Positron': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 20
    }),
    'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    })
  };

  let defaultBasemap = 'Carto Positron';
  if (globalThis.NkuaWebGISMap?.addDefault) {
    defaultBasemap = globalThis.NkuaWebGISMap.addDefault(map, baseMaps);
  } else {
    baseMaps['Carto Positron']?.addTo(map);
  }

  if (globalThis.NkuaWebGISMap?.addBasemapPicker) {
    globalThis.NkuaWebGISMap.addBasemapPicker(map, baseMaps, { defaultName: defaultBasemap });
  }

  if (globalThis.NkuaWebGISMap?.addNorthArrow) {
    globalThis.NkuaWebGISMap.addNorthArrow(map);
  }

  const measurementTool = new MeasurementTool(map, { language });

  const categories = getLocalizedWonderCategories(language);

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 48,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: (group) => {
      if (globalThis.NkuaWebGISMap?.createCategoryClusterIcon) {
        return globalThis.NkuaWebGISMap.createCategoryClusterIcon(group, WONDER_MAP_CATEGORIES);
      }
      const count = group.getChildCount();
      const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
      return L.divIcon({
        className: `marker-cluster marker-cluster-${size}`,
        html: `<div role="img" aria-label="${escapeHtml(formatClusterCount(language, count))}"><span>${count}</span></div>`,
        iconSize: [40, 40]
      });
    }
  });

  const markers = new Map();
  map.addLayer(cluster);

  const mapLegend = globalThis.NkuaWebGISMap?.addCategoryLegend ? globalThis.NkuaWebGISMap.addCategoryLegend(map, {
    title: language === 'el' ? 'Σημερινή κατάσταση' : 'Survival condition',
    subtitle: language === 'el' ? '4 κατηγορίες' : '4 groups',
    ariaLabel: language === 'el' ? 'Υπόμνημα κατάστασης μνημείων' : 'Wonder survival condition legend',
    categories: WONDER_MAP_CATEGORIES,
    classify: (record) => getWonderMapCategory(record).key
  }) : null;

  const buildMarker = (record, lang) => {
    const item = markerDescriptor(record, lang);
    const cat = getWonderMapCategory(record);
    const icon = globalThis.NkuaWebGISMap?.createCategoryMarkerIcon
      ? globalThis.NkuaWebGISMap.createCategoryMarkerIcon(cat, { size: 18 })
      : L.divIcon({
        className: '',
        html: item.iconMarkup,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

    const marker = L.marker(item.coordinates, { icon, title: item.name, keyboard: true });
    marker._mapCategory = cat.key;
    marker.bindPopup(createMapPreviewMarkup(record, lang), {
      className: 'wonder-preview-popup',
      maxWidth: 360,
      minWidth: 300,
      offset: [0, -12],
      closeButton: true,
      autoPanPadding: [24, 24]
    });
    marker.on('click', () => marker.openPopup());
    return marker;
  };

  const update = (nextRecords, lang = language) => {
    language = lang;
    measurementTool.setLanguage(lang);
    cluster.clearLayers();
    markers.clear();
    nextRecords.forEach((record) => {
      const marker = buildMarker(record, lang);
      markers.set(record.id, marker);
      cluster.addLayer(marker);
    });

    if (mapLegend?.update) {
      mapLegend.update(nextRecords);
    }
  };

  element.addEventListener('click', (event) => {
    const action = event.target.closest('[data-preview-details]');
    if (action) onSelect(action.dataset.previewDetails);
  });

  const focus = (record, { openPreview = true } = {}) => {
    const marker = markers.get(record.id);
    const destination = [record.coordinates.lat, record.coordinates.lng];
    const zoom = Math.max(map.getZoom(), 10);
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      map.setView(destination, zoom, { animate: false });
      if (openPreview) revealMarkerPreview(cluster, marker);
    } else {
      if (openPreview) map.once('moveend', () => revealMarkerPreview(cluster, marker));
      map.flyTo(destination, zoom, { duration: 0.65 });
    }
  };

  update(records, language);
  return {
    map,
    update,
    focus,
    measurementTool,
    closePreview: () => map.closePopup(),
    invalidateSize: () => map.invalidateSize()
  };
}
