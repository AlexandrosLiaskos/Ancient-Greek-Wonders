export function clampZoom(scale, min = 1, max = 4) {
  return Math.max(min, Math.min(max, Math.round(scale * 100) / 100));
}

export function calculatePanBounds(scale, viewportWidth, viewportHeight, imageWidth, imageHeight) {
  if (scale <= 1 || !viewportWidth || !viewportHeight || !imageWidth || !imageHeight) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  // Calculate rendered dimensions at scale(1) with object-fit: contain
  const aspectImage = imageWidth / imageHeight;
  const aspectViewport = viewportWidth / viewportHeight;

  let baseWidth = viewportWidth;
  let baseHeight = viewportHeight;

  if (aspectImage > aspectViewport) {
    baseHeight = viewportWidth / aspectImage;
  } else {
    baseWidth = viewportHeight * aspectImage;
  }

  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  const maxDx = Math.max(0, (scaledWidth - viewportWidth) / 2);
  const maxDy = Math.max(0, (scaledHeight - viewportHeight) / 2);

  return {
    minX: -maxDx,
    maxX: maxDx,
    minY: -maxDy,
    maxY: maxDy
  };
}

export function getDownloadFilename(asset, wonderId = 'monument', index = 0) {
  if (!asset?.src) return `${wonderId}-view-${index + 1}.webp`;
  const filename = asset.src.split('/').pop();
  if (filename && filename.endsWith('.webp')) {
    return `${wonderId}-${filename}`;
  }
  return `${wonderId}-view-${index + 1}.webp`;
}

export class ImageLightbox {
  constructor(elements, options = {}) {
    this.elements = elements;
    this.options = options;
    this.language = options.language || 'en';

    this.assets = [];
    this.currentIndex = 0;
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.startTranslateX = 0;
    this.startTranslateY = 0;
    this.wonderId = '';
    this.wonderName = '';

    this.bindEvents();
  }

  bindEvents() {
    const {
      modal,
      closeBtn,
      zoomInBtn,
      zoomOutBtn,
      zoomResetBtn,
      prevBtn,
      nextBtn,
      downloadBtn,
      viewport
    } = this.elements;

    closeBtn?.addEventListener('click', () => this.close());
    zoomInBtn?.addEventListener('click', () => this.zoom(0.5));
    zoomOutBtn?.addEventListener('click', () => this.zoom(-0.5));
    zoomResetBtn?.addEventListener('click', () => this.resetZoom());
    prevBtn?.addEventListener('click', () => this.prev());
    nextBtn?.addEventListener('click', () => this.next());
    downloadBtn?.addEventListener('click', (e) => this.handleDownload(e));

    // Backdrop click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal || e.target === viewport) {
        this.close();
      }
    });

    // Mouse wheel zoom
    viewport?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      this.zoom(delta);
    }, { passive: false });

    // Double click to zoom in/reset
    viewport?.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (this.scale > 1.05) {
        this.resetZoom();
      } else {
        this.zoom(1.5);
      }
    });

    // Drag to pan when zoomed
    const onPointerDown = (e) => {
      if (this.scale <= 1) return;
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.startTranslateX = this.translateX;
      this.startTranslateY = this.translateY;
      viewport.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.pan(this.startTranslateX + dx, this.startTranslateY + dy);
    };

    const onPointerUp = () => {
      this.isDragging = false;
      if (viewport) {
        viewport.style.cursor = this.scale > 1 ? 'grab' : 'default';
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    viewport?.addEventListener('pointerdown', onPointerDown);

    // Keyboard controls
    this.keyHandler = (e) => {
      if (!this.isOpen()) return;
      switch (e.key) {
        case 'Escape':
          e.stopPropagation();
          this.close();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.prev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.next();
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoom(0.5);
          break;
        case '-':
        case '_':
          e.preventDefault();
          this.zoom(-0.5);
          break;
        case '0':
          e.preventDefault();
          this.resetZoom();
          break;
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  isOpen() {
    return this.elements.modal?.classList.contains('active');
  }

  open(record, initialIndex = 0, language = 'en') {
    this.language = language;
    this.wonderId = record.id;
    this.wonderName = (language === 'el' && record.name?.el) ? record.name.el : (record.name?.en || record.name);

    const hero = record.media?.hero;
    if (!hero) return;
    this.assets = [hero, ...(record.media?.gallery || [])];
    this.currentIndex = Math.max(0, Math.min(this.assets.length - 1, initialIndex));

    this.resetZoom(false);
    this.render();

    this.elements.modal?.classList.add('active');
    document.body.classList.add('lightbox-open');
    this.elements.closeBtn?.focus();
  }

  close() {
    if (!this.isOpen()) return;
    this.elements.modal?.classList.remove('active');
    document.body.classList.remove('lightbox-open');
    this.resetZoom(false);
  }

  render() {
    const asset = this.assets[this.currentIndex];
    if (!asset) return;

    const {
      title,
      counter,
      image,
      desc,
      credit,
      prevBtn,
      nextBtn,
      zoomLevel,
      downloadBtn
    } = this.elements;

    if (title) title.textContent = this.wonderName;
    if (counter) counter.textContent = `${this.currentIndex + 1} / ${this.assets.length}`;

    if (image) {
      image.src = asset.src;
      image.alt = asset.alt?.[this.language] || asset.alt?.en || '';
      this.updateTransform();
    }

    if (desc) {
      desc.textContent = asset.alt?.[this.language] || asset.alt?.en || '';
    }

    if (credit) {
      const creator = asset.creator || '';
      const license = asset.license || '';
      const sourceUrl = asset.sourceUrl || '';
      const licenseUrl = asset.licenseUrl || '';
      credit.innerHTML = `${creator ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${creator}</a>` : ''}${creator && license ? ' · ' : ''}${license ? `<a href="${licenseUrl}" target="_blank" rel="noopener noreferrer">${license}</a>` : ''}`;
    }

    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentIndex === this.assets.length - 1;
    if (zoomLevel) zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;

    if (downloadBtn) {
      downloadBtn.href = asset.src;
      downloadBtn.download = getDownloadFilename(asset, this.wonderId, this.currentIndex);
    }
  }

  next() {
    if (this.currentIndex < this.assets.length - 1) {
      this.currentIndex++;
      this.resetZoom(false);
      this.render();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.resetZoom(false);
      this.render();
    }
  }

  zoom(delta) {
    const nextScale = clampZoom(this.scale + delta);
    if (nextScale === this.scale) return;
    this.scale = nextScale;
    this.pan(this.translateX, this.translateY);
  }

  resetZoom(render = true) {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    if (this.elements.viewport) {
      this.elements.viewport.style.cursor = 'default';
    }
    this.updateTransform();
    if (render && this.elements.zoomLevel) {
      this.elements.zoomLevel.textContent = '100%';
    }
  }

  pan(rawX, rawY) {
    const vp = this.elements.viewport;
    const img = this.elements.image;
    const bounds = calculatePanBounds(
      this.scale,
      vp?.clientWidth || 0,
      vp?.clientHeight || 0,
      img?.naturalWidth || img?.width || 1,
      img?.naturalHeight || img?.height || 1
    );

    this.translateX = Math.max(bounds.minX, Math.min(bounds.maxX, rawX));
    this.translateY = Math.max(bounds.minY, Math.min(bounds.maxY, rawY));
    this.updateTransform();

    if (this.elements.viewport) {
      this.elements.viewport.style.cursor = this.scale > 1 ? 'grab' : 'default';
    }
    if (this.elements.zoomLevel) {
      this.elements.zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  updateTransform() {
    if (!this.elements.image) return;
    this.elements.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  handleDownload(e) {
    const asset = this.assets[this.currentIndex];
    if (!asset?.src) return;
  }
}
