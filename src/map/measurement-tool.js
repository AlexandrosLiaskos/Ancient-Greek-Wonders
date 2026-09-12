/**
 * Measurement Tool for Ancient Greek Wonders WebGIS
 * Interactive distance and surface area calculation for archaeological and landscape research
 */

export class MeasurementTool {
  constructor(map, { language = 'en' } = {}) {
    this.map = map;
    this.language = language;
    this.isActive = false;
    this.points = [];
    this.polyline = null;
    this.markers = [];
    this.totalDistance = 0;
    this.area = 0;
    this.infoDisplay = null;
    this.control = null;

    this.init();
  }

  init() {
    this.createControl();
    this.setupMapEvents();
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.points.length > 0) this.showInfo();
  }

  createControl() {
    const L = globalThis.L;
    const title = this.language === 'el' ? 'Μέτρηση αποστάσεων και εμβαδού' : 'Measure distances and areas';
    const clearTitle = this.language === 'el' ? 'Καθαρισμός μετρήσεων' : 'Clear measurements';

    const MeasurementControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'measurement-control leaflet-bar');

        const toggleBtn = L.DomUtil.create('button', 'measurement-btn', container);
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.3 15.3 8.7 2.7a2.4 2.4 0 0 0-3.4 0L2.7 5.3a2.4 2.4 0 0 0 0 3.4l12.6 12.6a2.4 2.4 0 0 0 3.4 0l2.6-2.6a2.4 2.4 0 0 0 0-3.4Z"/><path d="m14.5 4.5 3 3"/><path d="m11.5 7.5 2 2"/><path d="m8.5 10.5 3 3"/><path d="m5.5 13.5 2 2"/></svg>';
        toggleBtn.title = title;
        toggleBtn.setAttribute('aria-label', title);

        const clearBtn = L.DomUtil.create('button', 'measurement-btn measurement-clear-btn', container);
        clearBtn.type = 'button';
        clearBtn.innerHTML = '✕';
        clearBtn.title = clearTitle;
        clearBtn.setAttribute('aria-label', clearTitle);
        clearBtn.style.display = 'none';

        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggle();
          toggleBtn.classList.toggle('active');
          clearBtn.style.display = this.isActive ? 'flex' : 'none';
        });

        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clear();
          toggleBtn.classList.remove('active');
          clearBtn.style.display = 'none';
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        this.toggleBtn = toggleBtn;
        this.clearBtn = clearBtn;

        return container;
      }
    });

    this.control = new MeasurementControl();
    this.control.addTo(this.map);
  }

  setupMapEvents() {
    this.map.on('click', (e) => {
      if (this.isActive) {
        this.addPoint(e.latlng);
      }
    });
  }

  toggle() {
    this.isActive = !this.isActive;
    if (!this.isActive) {
      this.map.getContainer().style.cursor = '';
    } else {
      this.map.getContainer().style.cursor = 'crosshair';
    }
  }

  addPoint(latlng) {
    const L = globalThis.L;
    this.points.push(latlng);

    const marker = L.circleMarker(latlng, {
      radius: 5,
      fillColor: '#2563eb',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(this.map);

    this.markers.push(marker);

    if (this.points.length > 1) {
      if (this.polyline) {
        this.polyline.setLatLngs(this.points);
      } else {
        this.polyline = L.polyline(this.points, {
          color: '#2563eb',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '5, 5'
        }).addTo(this.map);
      }
    }

    this.updateMeasurements();
    this.showInfo();
  }

  updateMeasurements() {
    if (this.points.length < 2) {
      this.totalDistance = 0;
      this.area = 0;
      return;
    }

    this.totalDistance = 0;
    for (let i = 0; i < this.points.length - 1; i += 1) {
      this.totalDistance += this.getDistance(this.points[i], this.points[i + 1]);
    }

    if (this.points.length >= 3) {
      this.area = this.getArea(this.points);
    } else {
      this.area = 0;
    }
  }

  getDistance(latlng1, latlng2) {
    const R = 6371; // Earth radius in km
    const dLat = ((latlng2.lat - latlng1.lat) * Math.PI) / 180;
    const dLng = ((latlng2.lng - latlng1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latlng1.lat * Math.PI) / 180) *
        Math.cos((latlng2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getArea(points) {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i += 1) {
      const j = (i + 1) % points.length;
      area += points[i].lng * points[j].lat;
      area -= points[j].lng * points[i].lat;
    }
    const R = 6371;
    area = (Math.abs(area) / 2) * (Math.PI / 180) * (Math.PI / 180) * R * R;
    return area;
  }

  showInfo() {
    const L = globalThis.L;
    if (!this.infoDisplay) {
      this.infoDisplay = L.control({ position: 'topright' });
      this.infoDisplay.onAdd = () => {
        const div = L.DomUtil.create('div', 'measurement-info');
        this.infoDiv = div;
        return div;
      };
      this.infoDisplay.addTo(this.map);
    }

    const isEl = this.language === 'el';
    const pointsLabel = isEl ? 'Σημεία' : 'Points';
    const distLabel = isEl ? 'Απόσταση' : 'Distance';
    const areaLabel = isEl ? 'Εμβαδόν' : 'Area';
    const hint = isEl ? 'Κλικ στον χάρτη για προσθήκη σημείων · ✕ για καθαρισμό' : 'Click map to add points · Click ✕ to clear';

    let html = '<div class="measurement-info-content">';
    html += `<div class="measurement-title">${isEl ? 'Μέτρηση' : 'Measurement'}</div>`;
    html += `<div class="measurement-stat">${pointsLabel}: ${this.points.length}</div>`;

    if (this.totalDistance > 0) {
      const km = this.totalDistance.toFixed(2);
      const m = (this.totalDistance * 1000).toFixed(0);
      html += `<div class="measurement-stat">${distLabel}: <strong>${km} km</strong> (${m} m)</div>`;
    }

    if (this.area > 0) {
      const km2 = this.area.toFixed(2);
      const ha = (this.area * 100).toFixed(1);
      html += `<div class="measurement-stat">${areaLabel}: <strong>${km2} km²</strong> (${ha} ha)</div>`;
    }

    html += `<div class="measurement-hint">${hint}</div>`;
    html += '</div>';

    this.infoDiv.innerHTML = html;
  }

  clear() {
    this.points = [];
    this.totalDistance = 0;
    this.area = 0;

    this.markers.forEach((m) => this.map.removeLayer(m));
    this.markers = [];

    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }

    if (this.infoDisplay) {
      this.map.removeControl(this.infoDisplay);
      this.infoDisplay = null;
    }

    this.isActive = false;
    if (this.toggleBtn) this.toggleBtn.classList.remove('active');
    if (this.clearBtn) this.clearBtn.style.display = 'none';
    this.map.getContainer().style.cursor = '';
  }
}
