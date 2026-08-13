import { localizeRecord, t } from '../i18n.js';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

export function createResultMarkup(record, language) {
  const item = localizeRecord(record, language);
  const hero = record.media?.hero;
  const image = hero ? `<img class="result-image" src="${escapeHtml(hero.src)}" width="96" height="72" alt="" loading="lazy" decoding="async" style="object-position:${escapeHtml(hero.focalPoint)}">` : '';
  return `<article class="result-item" data-wonder-id="${escapeHtml(record.id)}">
    <button class="result-focus" type="button" data-result-action="focus" aria-label="${escapeHtml(`${t(language, 'viewOnMap')}: ${item.name}`)}">
      <span class="result-media">${image}<b aria-hidden="true">${String(record.order).padStart(2, '0')}</b></span>
      <span class="result-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.location)}</small><em>${escapeHtml(item.period)}</em></span>
    </button>
    <div class="result-foot"><span class="result-status result-status--${escapeHtml(record.status)}">${escapeHtml(item.statusLabel)}</span><button class="result-details" type="button" data-result-action="details">${escapeHtml(t(language, 'openDetails'))}<span aria-hidden="true">→</span></button></div>
  </article>`;
}

export function createMapPreviewMarkup(record, language) {
  const item = localizeRecord(record, language);
  const hero = record.media?.hero;
  const image = hero ? `<img class="map-preview-image" src="${escapeHtml(hero.src)}" srcset="${escapeHtml(hero.srcset)}" sizes="340px" width="${hero.width}" height="${hero.height}" alt="" decoding="async" style="object-position:${escapeHtml(hero.focalPoint)}">` : '';
  return `<article class="map-preview">
    <div class="map-preview-media">${image}<span>${String(record.order).padStart(2, '0')}</span></div>
    <div class="map-preview-body">
      <p>${escapeHtml(item.categoryLabel)}</p>
      <h2>${escapeHtml(item.name)}</h2>
      <address>${escapeHtml(item.location)}</address>
      <dl><div><dt>${escapeHtml(t(language, 'period'))}</dt><dd>${escapeHtml(item.period)}</dd></div><div><dt>${escapeHtml(t(language, 'status'))}</dt><dd>${escapeHtml(item.statusLabel)}</dd></div></dl>
      <button type="button" data-preview-details="${escapeHtml(record.id)}">${escapeHtml(t(language, 'openDetails'))}<span aria-hidden="true">→</span></button>
    </div>
  </article>`;
}

function createMediaFigure(asset, language, index, eager) {
  const badge = asset.type === 'photo' ? '' : `<span class="media-type-badge">${escapeHtml(t(language, `mediaType_${asset.type}`))}</span>`;
  const alt = asset.alt[language] ?? asset.alt.en;
  return `<figure class="detail-figure" data-gallery-slide="${index}">
    <picture><source type="image/webp" srcset="${escapeHtml(asset.srcset)}" sizes="(max-width: 760px) 100vw, 50vw"><img class="detail-image" src="${escapeHtml(asset.src)}" srcset="${escapeHtml(asset.srcset)}" sizes="(max-width: 760px) 100vw, 50vw" width="${asset.width}" height="${asset.height}" alt="${escapeHtml(alt)}" ${eager ? 'decoding="async" fetchpriority="high"' : 'loading="lazy" decoding="async"'} style="object-position:${escapeHtml(asset.focalPoint)}"></picture>
    ${badge}
    <figcaption class="media-credit"><a href="${escapeHtml(asset.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(asset.creator)}</a><span aria-hidden="true">·</span><a href="${escapeHtml(asset.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(asset.license)}</a></figcaption>
  </figure>`;
}

function createMediaMarkup(record, language) {
  const hero = record.media?.hero;
  if (!hero) {
    return `<div class="image-placeholder"><span>${String(record.order).padStart(2, '0')}</span><strong>${escapeHtml(t(language, 'missingImage'))}</strong><small>${escapeHtml(t(language, 'missingImageHelp'))}</small></div>`;
  }
  const assets = [hero, ...(record.media.gallery ?? [])];
  return `<div class="detail-gallery" aria-label="${escapeHtml(t(language, 'imageGallery'))}">
    <div class="detail-gallery-track" data-gallery-track>${assets.map((asset, index) => createMediaFigure(asset, language, index, index === 0)).join('')}</div>
    ${assets.length > 1 ? `<div class="gallery-controls"><button type="button" data-gallery-prev aria-label="${escapeHtml(t(language, 'previousImage'))}">←</button><output data-gallery-count>1 / ${assets.length}</output><button type="button" data-gallery-next aria-label="${escapeHtml(t(language, 'nextImage'))}">→</button></div>` : ''}
  </div>`;
}

export function createDetailMarkup(record, language) {
  const item = localizeRecord(record, language);
  const sources = record.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`).join('');
  const media = createMediaMarkup(record, language);

  return `<div class="detail-media">${media}</div>
    <div class="detail-copy">
      <p class="detail-kind">${escapeHtml(item.categoryLabel)}</p>
      <h2 id="detail-title">${escapeHtml(item.name)}</h2>
      <p class="detail-location">${escapeHtml(item.location)}</p>
      <div class="detail-meta">
        <span>${escapeHtml(item.period)}</span><span>${escapeHtml(item.statusLabel)}</span>
        ${record.sevenWonder ? `<span>${escapeHtml(t(language, 'canonical'))}</span>` : ''}
      </div>
      <p class="detail-description">${escapeHtml(item.description)}</p>
      <div class="detail-context">
        <p><span>${escapeHtml(t(language, 'period'))}</span><strong>${escapeHtml(item.period)}</strong></p>
        <p><span>${escapeHtml(t(language, 'status'))}</span><strong>${escapeHtml(item.statusLabel)}</strong></p>
        <p><span>${escapeHtml(t(language, 'representative'))}</span><strong>${record.coordinates.lat.toFixed(4)}° N · ${record.coordinates.lng.toFixed(4)}° E</strong></p>
      </div>
      <section class="detail-sources"><h3>${escapeHtml(t(language, 'sources'))}</h3><ul>${sources}</ul></section>
    </div>`;
}
