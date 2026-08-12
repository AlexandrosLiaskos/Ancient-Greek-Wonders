import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { WONDERS } from '../src/data/wonders.js';

const reviewDir = join(process.cwd(), 'media', 'review', 'final');
await mkdir(reviewDir, { recursive: true });
for (let page = 0; page < Math.ceil(WONDERS.length / 10); page += 1) {
  const records = WONDERS.slice(page * 10, page * 10 + 10);
  const composites = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const image = await sharp(join(process.cwd(), record.media.hero.src.replace(/^\.\//, '')))
      .resize(420, 250, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82 }).toBuffer();
    const label = Buffer.from(`<svg width="420" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="420" height="50" fill="#11110f"/><text x="12" y="21" fill="#82c8b3" font-family="Arial" font-size="13" font-weight="700">${String(record.order).padStart(2, '0')}</text><text x="43" y="21" fill="white" font-family="Arial" font-size="13">${record.name.en.replaceAll('&', '&amp;')}</text><text x="43" y="40" fill="#a7a69f" font-family="Arial" font-size="11">${record.media.hero.type} · ${record.media.hero.license}</text></svg>`);
    const left = (index % 2) * 420;
    const top = Math.floor(index / 2) * 300;
    composites.push({ input: image, left, top }, { input: label, left, top: top + 250 });
  }
  await sharp({ create: { width: 840, height: 1500, channels: 3, background: '#e7e7e3' } })
    .composite(composites).jpeg({ quality: 88 }).toFile(join(reviewDir, `final-${page + 1}.jpg`));
}
