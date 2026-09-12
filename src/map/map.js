import { formatClusterCount, localizeRecord, t } from '../i18n.js';
import { createMapPreviewMarkup, createWonderHoverCardHTML, escapeHtml } from '../ui/render.js';
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

export function pinTooltipInsideMap(tooltip, map, opts = {}) {
  const el = tooltip?.getElement?.();
  if (!el || !map) return;

  const marginX = opts.marginX ?? (opts.margin ?? 10);
  const marginTop = opts.marginTop ?? (opts.margin ?? 10);
  const marginBottom = opts.marginBottom ?? (opts.margin !== undefined ? opts.margin : 52);
  const topOffset = opts.topOffset ?? [0, -14];
  const botOffset = opts.botOffset ?? [0, 14];

  // Reset any prior translation before measuring rects
  el.style.translate = '';

  const mapRect = map.getContainer().getBoundingClientRect();
  let elRect = el.getBoundingClientRect();

  const overflowsTop = elRect.top < mapRect.top + marginTop;
  const overflowsBottom = elRect.bottom > mapRect.bottom - marginBottom;
  const dir = tooltip.options.direction;

  if (overflowsTop && dir !== 'bottom') {
    tooltip.options.direction = 'bottom';
    tooltip.options.offset = botOffset;
    tooltip.update();
    elRect = el.getBoundingClientRect();
  } else if (overflowsBottom && dir !== 'top') {
    tooltip.options.direction = 'top';
    tooltip.options.offset = topOffset;
    tooltip.update();
    elRect = el.getBoundingClientRect();
  }

  let dx = 0;
  let dy = 0;
  if (elRect.left < mapRect.left + marginX) dx = (mapRect.left + marginX) - elRect.left;
  if (elRect.right > mapRect.right - marginX) dx = (mapRect.right - marginX) - elRect.right;
  if (elRect.top < mapRect.top + marginTop) dy = (mapRect.top + marginTop) - elRect.top;
  if (elRect.bottom > mapRect.bottom - marginBottom) dy = (mapRect.bottom - marginBottom) - elRect.bottom;

  el.style.translate = (dx || dy) ? `${dx}px ${dy}px` : '';
}

export function revealMarkerPreview(cluster, marker) {
  if (!marker) return;
  const open = () => {
    if (typeof marker.openPopup === 'function') marker.openPopup();
    else if (typeof marker.openTooltip === 'function') marker.openTooltip();
  };
  if (typeof cluster.zoomToShowLayer === 'function') {
    cluster.zoomToShowLayer(marker, open);
  } else {
    open();
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
    zoomToBoundsOnClick: true,
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
  const tooltipCloseTimers = new Map();
  map.addLayer(cluster);

  const mapLegend = globalThis.NkuaWebGISMap?.addCategoryLegend ? globalThis.NkuaWebGISMap.addCategoryLegend(map, {
    title: language === 'el' ? 'Σημερινή κατάσταση' : 'Survival condition',
    subtitle: language === 'el' ? '4 κατηγορίες' : '4 groups',
    ariaLabel: language === 'el' ? 'Υπόμνημα κατάστασης μνημείων' : 'Wonder survival condition legend',
    categories: WONDER_MAP_CATEGORIES,
    classify: (record) => getWonderMapCategory(record).key
  }) : null;

  const clearCloseTimer = (marker) => {
    const id = tooltipCloseTimers.get(marker);
    if (id) {
      clearTimeout(id);
      tooltipCloseTimers.delete(marker);
    }
  };

  const scheduleClose = (marker, delay = 320) => {
    clearCloseTimer(marker);
    const id = setTimeout(() => {
      marker.closeTooltip();
      tooltipCloseTimers.delete(marker);
    }, delay);
    tooltipCloseTimers.set(marker, id);
  };

  const bindTooltipHover = (marker) => {
    const tooltipEl = marker?.getTooltip?.()?.getElement?.();
    if (!tooltipEl || tooltipEl.dataset.hoverBound === '1') return;
    tooltipEl.dataset.hoverBound = '1';
    tooltipEl.addEventListener('mouseenter', () => clearCloseTimer(marker));
    tooltipEl.addEventListener('mouseleave', () => scheduleClose(marker, 180));
    tooltipEl.addEventListener('click', (e) => {
      e.stopPropagation();
      marker.closeTooltip();
      onSelect(marker._wonderId);
    });
  };

  const buildMarker = (record, lang) => {
    const item = markerDescriptor(record, lang);
    const cat = getWonderMapCategory(record);
    const icon = globalThis.NkuaWebGISMap?.createCategoryMarkerIcon
      ? globalThis.NkuaWebGISMap.createCategoryMarkerIcon(cat, { size: 18 })
      : L.divIcon({
        className: '',
        html: item.iconMarkup,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

    const marker = L.marker(item.coordinates, { icon, keyboard: true });
    marker._mapCategory = cat.key;
    marker._wonderId = record.id;

    marker.bindTooltip(createWonderHoverCardHTML(record, lang), {
      className: 'custom-tooltip',
      direction: 'top',
      offset: [0, -14],
      interactive: true,
      opacity: 1
    });

    // Provide openPopup fallback so any callers (e.g. revealMarkerPreview) open the tooltip
    marker.openPopup = () => marker.openTooltip();
    marker.closePopup = () => marker.closeTooltip();

    marker.on('mouseover', () => {
      clearCloseTimer(marker);
      if (!marker.isTooltipOpen()) marker.openTooltip();
    });

    marker.on('mouseout', () => {
      scheduleClose(marker, 320);
    });

    marker.on('tooltipopen', (e) => {
      bindTooltipHover(marker);
      requestAnimationFrame(() => pinTooltipInsideMap(e.tooltip, map));
    });

    marker.on('click', (e) => {
      if (e && e.originalEvent) {
        L.DomEvent.stopPropagation(e);
      }
      clearCloseTimer(marker);
      marker.closeTooltip();
      onSelect(record.id);
    });

    return marker;
  };

  const update = (nextRecords, lang = language) => {
    language = lang;
    measurementTool.setLanguage(lang);
    tooltipCloseTimers.forEach((id) => clearTimeout(id));
    tooltipCloseTimers.clear();
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
    const hoverCard = event.target.closest('[data-hover-wonder]');
    if (hoverCard) onSelect(hoverCard.dataset.hoverWonder);
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
    closePreview: () => {
      map.closeTooltip();
      if (typeof map.closePopup === 'function') map.closePopup();
    },
    invalidateSize: () => map.invalidateSize()
  };
}
