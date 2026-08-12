import { localizeRecord } from '../i18n.js';

export function markerDescriptor(record, language) {
  const item = localizeRecord(record, language);
  return {
    id: record.id,
    name: item.name,
    label: `${item.name} — ${item.statusLabel}`,
    className: `wonder-marker wonder-marker--${record.status}`,
    coordinates: [record.coordinates.lat, record.coordinates.lng],
    order: record.order,
    location: item.location,
    period: item.period,
    category: item.categoryLabel,
    status: item.statusLabel
  };
}

export function createWondersMap(element, records, { language = 'en', onSelect = () => {} } = {}) {
  const L = globalThis.L;
  if (!L) throw new Error('Leaflet is unavailable');

  const map = L.map(element, { zoomControl: false, minZoom: 3, worldCopyJump: true }).setView([37.2, 23.6], 5);
  L.control.zoom({ position: 'topright' }).addTo(map);

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
  L.control.layers(layers, null, { position: 'topright' }).addTo(map);

  const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 44, spiderfyOnMaxZoom: true });
  const markers = new Map();
  map.addLayer(cluster);

  const buildMarker = (record, lang) => {
    const item = markerDescriptor(record, lang);
    const icon = L.divIcon({
      className: '',
      html: `<span class="${item.className}" role="img" aria-label="${item.label.replace(/"/g, '&quot;')}">${String(item.order).padStart(2, '0')}</span>`,
      iconSize: [34, 34], iconAnchor: [17, 17]
    });
    const marker = L.marker(item.coordinates, { icon, title: item.name, keyboard: true });
    marker.bindTooltip(`<div class="map-tooltip"><small>${item.category}</small><strong>${item.name}</strong><span>${item.location}</span><em>${item.period}</em></div>`, { direction: 'top', offset: [0, -18], opacity: 1 });
    marker.on('click', () => onSelect(record.id));
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
  };

  const focus = (record) => {
    const marker = markers.get(record.id);
    map.flyTo([record.coordinates.lat, record.coordinates.lng], Math.max(map.getZoom(), 10), { duration: 0.65 });
    if (marker) setTimeout(() => marker.openTooltip(), 680);
  };

  update(records, language);
  return { map, update, focus, invalidateSize: () => map.invalidateSize() };
}
