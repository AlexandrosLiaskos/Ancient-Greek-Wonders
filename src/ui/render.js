import { localizeRecord, t } from '../i18n.js';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

export function createResultMarkup(record, language) {
  const item = localizeRecord(record, language);
  return `<button class="result-item" type="button" data-wonder-id="${escapeHtml(record.id)}" aria-label="${escapeHtml(`${t(language, 'openDetails')}: ${item.name}`)}">
    <span class="result-order" aria-hidden="true">${String(record.order).padStart(2, '0')}</span>
    <span class="result-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.location)}</small></span>
    <span class="result-status result-status--${escapeHtml(record.status)}">${escapeHtml(item.statusLabel)}</span>
  </button>`;
}

function createMediaMarkup(record, language) {
  const hero = record.media?.hero;
  if (!hero) {
    return `<div class="image-placeholder"><span>${String(record.order).padStart(2, '0')}</span><strong>${escapeHtml(t(language, 'missingImage'))}</strong><small>${escapeHtml(t(language, 'missingImageHelp'))}</small></div>`;
  }
  const badge = hero.type === 'photo' ? '' : `<span class="media-type-badge">${escapeHtml(t(language, `mediaType_${hero.type}`))}</span>`;
  const alt = hero.alt[language] ?? hero.alt.en;
  return `<figure class="detail-figure">
    <picture><source type="image/webp" srcset="${escapeHtml(hero.srcset)}" sizes="(max-width: 760px) 100vw, 50vw"><img class="detail-image" src="${escapeHtml(hero.src)}" srcset="${escapeHtml(hero.srcset)}" sizes="(max-width: 760px) 100vw, 50vw" width="${hero.width}" height="${hero.height}" alt="${escapeHtml(alt)}" decoding="async" fetchpriority="high" style="object-position:${escapeHtml(hero.focalPoint)}"></picture>
    ${badge}
    <figcaption class="media-credit"><a href="${escapeHtml(hero.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(hero.creator)}</a><span aria-hidden="true">·</span><a href="${escapeHtml(hero.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(hero.license)}</a></figcaption>
  </figure>`;
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
      <p class="coordinate-note"><strong>${escapeHtml(t(language, 'representative'))}</strong> ${record.coordinates.lat.toFixed(4)}, ${record.coordinates.lng.toFixed(4)}</p>
      <section class="detail-sources"><h3>${escapeHtml(t(language, 'sources'))}</h3><ul>${sources}</ul></section>
    </div>`;
}
