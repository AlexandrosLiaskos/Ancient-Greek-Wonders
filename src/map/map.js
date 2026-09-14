import { formatClusterCount, localizeRecord, t } from '../i18n.js';
import { createMapPreviewMarkup, createWonderHoverCardHTML, escapeHtml } from '../ui/render.js';
import { MeasurementTool } from './measurement-tool.js';
import { AncientToponymsLayer } from './ancient-toponyms-layer.js';

export function suppressMaplibreModernLabels(layer) {
  if (!layer || typeof layer.getMaplibreMap !== 'function') return;
  const mlMap = layer.getMaplibreMap();
  if (!mlMap) return;

  const hide = () => {
    try {
      const style = mlMap.getStyle();
      if (!style || !style.layers) return;
      const modernLabelLayers = [
        'waterway_line_label', 'water_name_point_label', 'water_name_line_label',
        'highway-name-path', 'highway-name-minor', 'highway-name-major',
        'highway-shield-non-us', 'highway-shield-us-interstate', 'road_shield_us',
        'airport', 'label_other', 'label_village', 'label_town', 'label_state',
        'label_city', 'label_city_capital', 'label_country_3', 'label_country_2', 'label_country_1'
      ];
      for (const l of style.layers) {
        if (l.type === 'symbol' || modernLabelLayers.includes(l.id)) {
          mlMap.setLayoutProperty(l.id, 'visibility', 'none');
        }
      }
    } catch (_e) {}
  };

  if (mlMap.isStyleLoaded()) hide();
  else {
    mlMap.once('styledata', hide);
    mlMap.once('load', hide);
  }
}

export function addAncientToponymsControl(map, toponymsLayer, language = 'en') {
  const L = globalThis.L;
  if (!L || !map || !toponymsLayer) return null;

  const ToponymControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control ancient-toponyms-control');
      const button = L.DomUtil.create('button', 'ancient-toponyms-btn active', container);
      button.type = 'button';
      button.setAttribute('aria-label', t(language, 'toggleToponyms'));
      button.title = t(language, 'ancientToponyms');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      `;

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = toponymsLayer.toggleVisible();
        button.classList.toggle('active', isVisible);
      });

      this._button = button;
      return container;
    },
    updateLanguage: function (lang) {
      if (this._button) {
        this._button.setAttribute('aria-label', t(lang, 'toggleToponyms'));
        this._button.title = t(lang, 'ancientToponyms');
      }
    }
  });

  const control = new ToponymControl();
  control.addTo(map);
  return control;
}

export const WONDER_MAP_CATEGORIES = [
  { key: 'lost', label: 'Lost / submerged', color: '#b91c1c', border: '#f87171' },
  { key: 'ruins', label: 'Ruins / excavated', color: '#ea580c', border: '#fdba74' },
  { key: 'extant', label: 'Standing / restored', color: '#0d9488', border: '#5eead4' }
];

export const SURVIVAL_GROUP_BY_STATUS = {
  standing: 'extant',
  restored: 'extant',
  'partly-standing': 'extant',
  'partly-restored': 'extant',
  ruins: 'ruins',
  excavated: 'ruins',
  're-erected': 'ruins',
  unfinished: 'ruins',
  lost: 'lost'
};

export function getWonderMapCategory(wonder) {
  const key = SURVIVAL_GROUP_BY_STATUS[wonder?.status] || 'ruins';
  return WONDER_MAP_CATEGORIES.find((cat) => cat.key === key) || WONDER_MAP_CATEGORIES[1];
}

export function getLocalizedWonderCategories(language) {
  if (language === 'el') {
    return [
      { key: 'lost', label: 'Χαμένο / βυθισμένο', color: '#b91c1c', border: '#f87171' },
      { key: 'ruins', label: 'Ερείπια / ανεσκαμμένο', color: '#ea580c', border: '#fdba74' },
      { key: 'extant', label: 'Όρθιο / αναστηλωμένο', color: '#0d9488', border: '#5eead4' }
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

  const margin = opts.margin ?? 8;
  const topOffset = opts.topOffset ?? [0, -14];
  const botOffset = opts.botOffset ?? [0, 14];

  // Reset any prior translation before measuring rects
  el.style.translate = '';

  const mapRect = map.getContainer().getBoundingClientRect();
  let elRect = el.getBoundingClientRect();

  const overflowsTop = elRect.top < mapRect.top + margin;
  const overflowsBottom = elRect.bottom > mapRect.bottom - margin;
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
  if (elRect.left < mapRect.left + margin) dx = (mapRect.left + margin) - elRect.left;
  if (elRect.right > mapRect.right - margin) dx = (mapRect.right - margin) - elRect.right;
  if (elRect.top < mapRect.top + margin) dy = (mapRect.top + margin) - elRect.top;
  if (elRect.bottom > mapRect.bottom - margin) dy = (mapRect.bottom - margin) - elRect.bottom;

  // Prevent vertical translation from shifting the card across the pin
  if (typeof map.latLngToContainerPoint === 'function' && tooltip._latlng) {
    const anchor = map.latLngToContainerPoint(tooltip._latlng);
    const pinTop = mapRect.top + anchor.y - 9;
    const pinBottom = mapRect.top + anchor.y + 9;
    const currentDir = tooltip.options.direction;

    if (currentDir === 'bottom' && dy < 0) {
      const maxUpward = (pinBottom + 4) - elRect.top;
      if (dy < maxUpward) dy = maxUpward;
    } else if (currentDir === 'top' && dy > 0) {
      const maxDownward = (pinTop - 4) - elRect.bottom;
      if (dy > maxDownward) dy = maxDownward;
    }
  }

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
    worldCopyJump: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 80
  }).setView([37.2, 23.6], 5);

  const baseMaps = globalThis.NkuaWebGISMap?.createBasemaps ? globalThis.NkuaWebGISMap.createBasemaps() : {
    'Carto Positron': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
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

  // Suppress modern OSM country/city labels on vector Positron so ancient names take their place
  map.on('layeradd', (e) => {
    if (e.layer && typeof e.layer.getMaplibreMap === 'function') {
      suppressMaplibreModernLabels(e.layer);
    }
  });
  map.eachLayer((layer) => {
    if (layer && typeof layer.getMaplibreMap === 'function') {
      suppressMaplibreModernLabels(layer);
    }
  });

  if (globalThis.NkuaWebGISMap?.addBasemapPicker) {
    globalThis.NkuaWebGISMap.addBasemapPicker(map, baseMaps, { defaultName: defaultBasemap });
  }

  if (globalThis.NkuaWebGISMap?.addNorthArrow) {
    globalThis.NkuaWebGISMap.addNorthArrow(map);
  }

  const measurementTool = new MeasurementTool(map, { language });
  const ancientToponymsLayer = new AncientToponymsLayer({ language });
  ancientToponymsLayer.addTo(map);
  const toponymControl = addAncientToponymsControl(map, ancientToponymsLayer, language);

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

  const closeAllTooltips = () => {
    tooltipCloseTimers.forEach((id) => clearTimeout(id));
    tooltipCloseTimers.clear();
    markers.forEach((m) => {
      if (m && typeof m.closeTooltip === 'function') {
        m.closeTooltip();
      }
    });
  };

  map.on('click', closeAllTooltips);
  map.on('zoomstart movestart', closeAllTooltips);

  const mapLegend = globalThis.NkuaWebGISMap?.addCategoryLegend ? globalThis.NkuaWebGISMap.addCategoryLegend(map, {
    title: language === 'el' ? 'Σημερινή κατάσταση' : 'Survival condition',
    subtitle: language === 'el' ? 'σύγχρονη εποχή' : 'by modern era',
    ariaLabel: language === 'el' ? 'Υπόμνημα κατάστασης μνημείων' : 'Wonder survival condition legend',
    categories: getLocalizedWonderCategories(language),
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
      closeAllTooltips();
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
      if (!marker.isTooltipOpen()) {
        markers.forEach((other) => {
          if (other !== marker && other.isTooltipOpen && other.isTooltipOpen()) {
            other.closeTooltip();
          }
        });

        // Pre-calculate optimal direction before opening so Leaflet renders it right the first time
        if (typeof map.latLngToContainerPoint === 'function' && typeof map.getSize === 'function') {
          const point = map.latLngToContainerPoint(item.coordinates);
          const mapSize = map.getSize();
          const availableAbove = point.y;
          const availableBelow = mapSize.y - point.y;
          const approxHeight = 220;

          const preferBottom = availableAbove < (approxHeight + 20) || (availableAbove < 260 && availableBelow > availableAbove);
          const tooltip = marker.getTooltip();
          if (tooltip && tooltip.options) {
            tooltip.options.direction = preferBottom ? 'bottom' : 'top';
            tooltip.options.offset = preferBottom ? [0, 14] : [0, -14];
          }
        }

        marker.openTooltip();
      }
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
      closeAllTooltips();
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
    ancientToponymsLayer,
    toponymControl,
    setToponymLanguage: (lang) => {
      ancientToponymsLayer.setLanguage(lang);
      toponymControl?.updateLanguage?.(lang);
    },
    closePreview: () => {
      closeAllTooltips();
      if (typeof map.closePopup === 'function') map.closePopup();
    },
    invalidateSize: () => map.invalidateSize()
  };
}
