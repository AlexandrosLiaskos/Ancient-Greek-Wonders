import { formatClusterCount, localizeRecord, t } from '../i18n.js';
import { createMapPreviewMarkup, escapeHtml } from '../ui/render.js';

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
  cluster.zoomToShowLayer(marker, () => marker.openPopup());
}

export function createWondersMap(element, records, { language = 'en', onSelect = () => {} } = {}) {
  const L = globalThis.L;
  if (!L) throw new Error('Leaflet is unavailable');

  const map = L.map(element, { zoomControl: false, minZoom: 3, worldCopyJump: true }).setView([37.2, 23.6], 5);
  const zoomControl = L.control.zoom({ position: 'topright' }).addTo(map);

  const layers = {
    'Carto Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 20
    }),
    'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }),
    'OpenTopoMap': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap', maxZoom: 17
    })
  };
  layers['Carto Light'].addTo(map);
  const layerControl = L.control.layers(layers, null, { position: 'topright' }).addTo(map);

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 44,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: (group) => {
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

  const buildMarker = (record, lang) => {
    const item = markerDescriptor(record, lang);
    const icon = L.divIcon({
      className: '',
      html: item.iconMarkup,
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    const marker = L.marker(item.coordinates, { icon, title: item.name, keyboard: true });
    marker.bindPopup(createMapPreviewMarkup(record, lang), { className: 'wonder-preview-popup', maxWidth: 360, minWidth: 310, offset: [0, -18], closeButton: true, autoPanPadding: [24, 24] });
    marker.on('mouseover focus', () => marker.openPopup());
    marker.on('click', () => marker.openPopup());
    return marker;
  };

  const update = (nextRecords, lang = language) => {
    language = lang;
    cluster.clearLayers();
    markers.clear();
    nextRecords.forEach((record) => {
      const marker = buildMarker(record, lang);
      markers.set(record.id, marker);
      cluster.addLayer(marker);
    });
    const labels = mapControlLabels(language);
    const zoomLinks = zoomControl.getContainer().querySelectorAll('a');
    [[zoomLinks[0], labels.zoomIn], [zoomLinks[1], labels.zoomOut]].forEach(([link, label]) => {
      link?.setAttribute('title', label);
      link?.setAttribute('aria-label', label);
    });
    const layerToggle = layerControl.getContainer().querySelector('.leaflet-control-layers-toggle');
    layerToggle?.setAttribute('title', labels.layers);
    layerToggle?.setAttribute('aria-label', labels.layers);
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
  return { map, update, focus, closePreview: () => map.closePopup(), invalidateSize: () => map.invalidateSize() };
}
