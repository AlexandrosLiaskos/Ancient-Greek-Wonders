const MEDIA_TYPES = new Set(['photo', 'artwork', 'engraving', 'model', 'reconstruction']);

function requireHttps(value, field) {
  if (typeof value !== 'string' || !value.startsWith('https://')) {
    throw new TypeError(`${field} must be an HTTPS URL`);
  }
}

function validateAsset(asset, label) {
  if (typeof asset?.src !== 'string' || !asset.src.startsWith('./assets/images/')) {
    throw new TypeError(`${label} must use a local path under ./assets/images/`);
  }
  if (!Number.isInteger(asset.width) || asset.width <= 0 || !Number.isInteger(asset.height) || asset.height <= 0) {
    throw new TypeError(`${label} must include positive intrinsic dimensions`);
  }
  if (!asset.alt?.en?.trim() || !asset.alt?.el?.trim()) {
    throw new TypeError(`${label} must include bilingual alt text`);
  }
  if (!MEDIA_TYPES.has(asset.type)) throw new TypeError(`${label} has an unsupported media type`);
  if (!asset.creator?.trim() || !asset.license?.trim()) throw new TypeError(`${label} must include creator and license`);
  requireHttps(asset.sourceUrl, `${label}.sourceUrl`);
  requireHttps(asset.licenseUrl, `${label}.licenseUrl`);
}

export function validateMediaRecord(record) {
  if (!record?.hero) throw new TypeError('media record must include a hero');
  validateAsset(record.hero, 'hero');
  if (!Array.isArray(record.gallery ?? [])) throw new TypeError('gallery must be an array');
  (record.gallery ?? []).forEach((asset, index) => validateAsset(asset, `gallery[${index}]`));
  return record;
}

export function attachMedia(records, mediaById = {}) {
  const ids = new Set(records.map(({ id }) => id));
  for (const id of Object.keys(mediaById)) {
    if (!ids.has(id)) throw new TypeError(`media references unknown record id: ${id}`);
    validateMediaRecord(mediaById[id]);
  }
  return records.map((record) => ({ ...record, media: mediaById[record.id] ?? null }));
}
