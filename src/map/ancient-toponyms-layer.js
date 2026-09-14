import { ANCIENT_TOPONYMS } from '../data/ancient-toponyms.js';

/**
 * Checks if two axis-aligned bounding boxes collide with an optional margin.
 */
export function isBoxColliding(b1, b2, margin = 4) {
  return !(
    b1.x2 + margin < b2.x1 ||
    b1.x1 - margin > b2.x2 ||
    b1.y2 + margin < b2.y1 ||
    b1.y1 - margin > b2.y2
  );
}

/**
 * Filter toponyms for a given zoom level, sorted by priority.
 */
export function filterToponymsByZoom(toponyms, zoom) {
  return toponyms
    .filter((item) => item.minZoom <= zoom && (!item.maxZoom || zoom <= item.maxZoom))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Computes bounding box estimation for decluttering.
 */
export function estimateToponymBox(item, point, text, fontSize, isCentered = false) {
  const charWidth = fontSize * 0.58;
  const width = text.length * charWidth + (item.type === 'macro' || item.type === 'region' ? text.length * 2 : 0);
  const height = fontSize * 1.2;

  let x1, x2, y1, y2;
  if (isCentered) {
    x1 = point.x - width / 2;
    x2 = point.x + width / 2;
    y1 = point.y - height / 2;
    y2 = point.y + height / 2;
  } else {
    x1 = point.x + 5;
    x2 = x1 + width;
    y1 = point.y - height / 2;
    y2 = point.y + height / 2;
  }

  return { x1, y1, x2, y2, width, height };
}

/**
 * Ancient Toponyms Leaflet Canvas Layer.
 * Renders ancient geographic, regional, and settlement toponyms with zero empires.
 * Strictly calibrated per zoom level to eliminate visual clutter.
 */
export class AncientToponymsLayer {
  constructor(options = {}) {
    this.toponyms = options.toponyms || ANCIENT_TOPONYMS;
    this.language = options.language || 'en';
    this.visible = options.visible !== false;
    this.map = null;
    this.canvas = null;
    this.ctx = null;
    this.pane = null;
    this._onMove = () => this.redraw();
  }

  addTo(map) {
    this.map = map;
    this.initPane();
    this.initCanvas();
    this.attachEvents();
    this.redraw();
    return this;
  }

  remove() {
    this.detachEvents();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.map = null;
    return this;
  }

  initPane() {
    if (!this.map) return;
    const paneName = 'ancientToponymsPane';
    let pane = this.map.getPane(paneName);
    if (!pane) {
      pane = this.map.createPane(paneName);
      // zIndex 350: Above basemap tilePane (200) and below markerPane (600)
      pane.style.zIndex = '350';
      pane.style.pointerEvents = 'none';
    }
    this.pane = pane;
  }

  initCanvas() {
    if (!this.pane) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'ancient-toponyms-canvas';
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    this.pane.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  attachEvents() {
    if (!this.map) return;
    this.map.on('move', this._onMove);
    this.map.on('moveend', this._onMove);
    this.map.on('zoomend', this._onMove);
    this.map.on('resize', this._onMove);
    this.map.on('viewreset', this._onMove);
  }

  detachEvents() {
    if (!this.map) return;
    this.map.off('move', this._onMove);
    this.map.off('moveend', this._onMove);
    this.map.off('zoomend', this._onMove);
    this.map.off('resize', this._onMove);
    this.map.off('viewreset', this._onMove);
  }

  setLanguage(language) {
    if (this.language !== language) {
      this.language = language;
      this.redraw();
    }
  }

  setVisible(visible) {
    if (this.visible !== visible) {
      this.visible = visible;
      if (this.canvas) {
        this.canvas.style.display = visible ? 'block' : 'none';
      }
      this.redraw();
    }
  }

  toggleVisible() {
    this.setVisible(!this.visible);
    return this.visible;
  }

  redraw() {
    if (!this.map || !this.canvas || !this.ctx || !this.visible) {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    const size = this.map.getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Synchronize canvas size and position
    const width = size.x;
    const height = size.y;
    if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
    }

    const topLeft = this.map.containerPointToLayerPoint([0, 0]);
    if (globalThis.L?.DomUtil?.setPosition) {
      globalThis.L.DomUtil.setPosition(this.canvas, topLeft);
    } else {
      this.canvas.style.transform = `translate3d(${topLeft.x}px, ${topLeft.y}px, 0px)`;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const zoom = this.map.getZoom();
    const candidates = filterToponymsByZoom(this.toponyms, zoom);
    const placedBoxes = [];

    for (const item of candidates) {
      const pt = this.map.latLngToContainerPoint([item.lat, item.lng]);

      // Cull features far outside the visible viewport
      if (pt.x < -60 || pt.x > width + 60 || pt.y < -30 || pt.y > height + 30) {
        continue;
      }

      const text = item.name[this.language] || item.name.en || item.id;
      const style = this.getStyle(item, zoom);

      ctx.font = style.font;
      const textWidth = ctx.measureText(text).width;
      const isCentered = style.centered;

      const box = {
        x1: isCentered ? pt.x - textWidth / 2 - 2 : pt.x + 4,
        x2: isCentered ? pt.x + textWidth / 2 + 2 : pt.x + 6 + textWidth,
        y1: pt.y - style.fontSize * 0.7,
        y2: pt.y + style.fontSize * 0.4
      };

      // Check collision against already placed higher-priority labels
      let collides = false;
      for (const placed of placedBoxes) {
        if (isBoxColliding(box, placed, style.collisionMargin || 4)) {
          collides = true;
          break;
        }
      }

      if (collides) continue;
      placedBoxes.push(box);

      // Render anchor dot if configured
      if (style.hasDot) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, style.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = style.dotColor;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();
      }

      // Render text halo
      ctx.textAlign = isCentered ? 'center' : 'left';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = style.haloWidth || 2;
      ctx.strokeStyle = style.haloColor || 'rgba(255, 255, 255, 0.9)';
      ctx.strokeText(text, isCentered ? pt.x : pt.x + 6, pt.y);

      // Render fill text
      ctx.fillStyle = style.fillColor;
      ctx.fillText(text, isCentered ? pt.x : pt.x + 6, pt.y);
    }

    ctx.restore();
  }

  getStyle(item, zoom) {
    switch (item.type) {
      case 'macro': {
        const fontSize = Math.min(13, Math.max(10, 8.5 + zoom * 0.6));
        return {
          font: `600 ${fontSize}px "Cormorant Garamond", Georgia, serif`,
          fontSize,
          fillColor: 'rgba(78, 86, 96, 0.82)',
          haloColor: 'rgba(255, 255, 255, 0.9)',
          haloWidth: 2.5,
          centered: true,
          hasDot: false,
          collisionMargin: 8
        };
      }
      case 'region': {
        const fontSize = Math.min(13.5, Math.max(10, 7.5 + zoom * 0.75));
        return {
          font: `600 ${fontSize}px "EB Garamond", Georgia, serif`,
          fontSize,
          fillColor: 'rgba(92, 75, 55, 0.85)',
          haloColor: 'rgba(255, 255, 255, 0.92)',
          haloWidth: 2.5,
          centered: true,
          hasDot: false,
          collisionMargin: 6
        };
      }
      case 'subregion': {
        const fontSize = Math.min(12, Math.max(9.5, 6.5 + zoom * 0.7));
        return {
          font: `500 ${fontSize}px "EB Garamond", Georgia, serif`,
          fontSize,
          fillColor: 'rgba(108, 90, 70, 0.82)',
          haloColor: 'rgba(255, 255, 255, 0.92)',
          haloWidth: 2,
          centered: true,
          hasDot: false,
          collisionMargin: 5
        };
      }
      case 'water': {
        const fontSize = Math.min(12.5, Math.max(9.5, 6.5 + zoom * 0.75));
        return {
          font: `italic 500 ${fontSize}px "Cormorant Garamond", Georgia, serif`,
          fontSize,
          fillColor: 'rgba(62, 92, 114, 0.82)',
          haloColor: 'rgba(255, 255, 255, 0.88)',
          haloWidth: 2,
          centered: true,
          hasDot: false,
          collisionMargin: 6
        };
      }
      case 'river': {
        const fontSize = Math.min(11, Math.max(9, 6 + zoom * 0.65));
        return {
          font: `italic 400 ${fontSize}px "Cormorant Garamond", Georgia, serif`,
          fontSize,
          fillColor: 'rgba(70, 100, 118, 0.85)',
          haloColor: 'rgba(255, 255, 255, 0.9)',
          haloWidth: 2,
          centered: false,
          hasDot: false,
          collisionMargin: 4
        };
      }
      case 'mountain': {
        const fontSize = Math.min(11, Math.max(9, 6 + zoom * 0.65));
        return {
          font: `italic 500 ${fontSize}px "EB Garamond", Georgia, serif`,
          fontSize,
          fillColor: 'rgba(102, 92, 80, 0.88)',
          haloColor: 'rgba(255, 255, 255, 0.9)',
          haloWidth: 2,
          centered: false,
          hasDot: true,
          dotRadius: 1.5,
          dotColor: 'rgba(120, 110, 95, 0.85)',
          collisionMargin: 4
        };
      }
      case 'city_major': {
        const fontSize = Math.min(13, Math.max(10.5, 7 + zoom * 0.75));
        return {
          font: `600 ${fontSize}px "EB Garamond", "Inter", sans-serif`,
          fontSize,
          fillColor: '#251e18',
          haloColor: 'rgba(255, 255, 255, 0.95)',
          haloWidth: 2.5,
          centered: false,
          hasDot: true,
          dotRadius: 2.5,
          dotColor: '#251e18',
          collisionMargin: 4
        };
      }
      case 'city_secondary': {
        const fontSize = Math.min(11.5, Math.max(9.5, 6 + zoom * 0.7));
        return {
          font: `500 ${fontSize}px "EB Garamond", "Inter", sans-serif`,
          fontSize,
          fillColor: '#3a3028',
          haloColor: 'rgba(255, 255, 255, 0.95)',
          haloWidth: 2.2,
          centered: false,
          hasDot: true,
          dotRadius: 1.8,
          dotColor: '#524338',
          collisionMargin: 3
        };
      }
      case 'city_minor':
      default: {
        const fontSize = Math.min(10.5, Math.max(9, 5.5 + zoom * 0.65));
        return {
          font: `400 ${fontSize}px "EB Garamond", "Inter", sans-serif`,
          fontSize,
          fillColor: '#4e433a',
          haloColor: 'rgba(255, 255, 255, 0.92)',
          haloWidth: 2,
          centered: false,
          hasDot: true,
          dotRadius: 1.3,
          dotColor: '#6e5e52',
          collisionMargin: 3
        };
      }
    }
  }
}
