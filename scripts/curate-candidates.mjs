import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { WONDERS } from '../src/data/wonders.js';

const USER_AGENT = 'AncientGreekWonders/1.0 (educational image curation)';
const REVIEW = join(process.cwd(), 'media', 'review');
const SEARCH_OVERRIDES = {
  'statue-zeus-olympia': 'Jupiter Olympien Quatremere de Quincy reconstruction',
  'mausoleum-halicarnassus': 'Mausoleum Halicarnassus reconstruction',
  'colossus-rhodes': 'Colossus of Rhodes engraving Helios',
  'lighthouse-alexandria': 'Pharos of Alexandria',
  knossos: 'Palace of Knossos Crete Greece',
  'temple-apollo-delphi': 'Temple Apollo Delphi Greece',
  akrotiri: 'Akrotiri Santorini archaeological excavation streets',
  'olympieion-athens': 'Olympieion Athens Temple Zeus',
  'athena-nike': 'Temple Athena Nike Acropolis Athens',
  'temple-hera-olympia': 'Temple Hera Olympia Greece',
  'apollo-epicurius-bassae': 'Temple Apollo Epicurius Bassae',
  'sanctuary-apollo-delos': 'Sanctuary Apollo Delos',
  'valley-temples-concordia': 'Temple of Concordia Agrigento BW 2012',
  'hera-paestum': 'Basilica Temple Hera Paestum',
  'poseidon-paestum': 'Temple Neptune Paestum',
  'temple-e-selinunte': 'Selinunte Temple E Hera Sicily',
  'athena-polias-priene': 'Temple Athena Priene ruins',
  'temple-zeus-cyrene': 'Temple Zeus Cyrene Libya',
  'asklepieion-epidaurus': 'Sanctuary Asclepius Epidaurus Abaton 52042444054',
  'olympia-sanctuary-stadium': 'Ancient stadium Olympia Greece starting line',
  'delphi-sanctuary': 'Delphi archaeological site Greece',
  'athenian-agora': 'Attica 06-13 Athens 22 View Acropolis Museum Ancient Agora',
  'odeon-herodes-atticus': 'Odeon Herodes Atticus Athens',
  'propylaea-athens': 'Propylaea Athens',
  'tunnel-eupalinos': 'Tunnel Eupalinos Samos',
  diolkos: 'ancient Diolkos stone trackway Corinth'
};

const acceptedLicense = /^(?:CC0|Public domain|CC BY(?:-SA)?(?: [234]\.[05])?)$/i;
const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithBackoff(url, options = {}) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 429 && response.status < 500) return response;
      const retryAfter = Number(response.headers.get('retry-after') ?? 2 ** attempt);
      await wait(Math.min(Math.max(retryAfter, 1), 15) * 1000);
    } catch (error) {
      if (attempt === 3) throw error;
      await wait(1000 * 2 ** attempt);
    }
  }
  throw new Error(`Wikimedia rate limit persisted: ${url}`);
}

async function searchCommons(record) {
  const query = SEARCH_OVERRIDES[record.id] ?? `${record.name.en} ${record.location.en.split(',')[0]}`;
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', generator: 'search', gsrsearch: query,
    gsrnamespace: '6', gsrlimit: '50', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '520'
  });
  const response = await fetchWithBackoff(api, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Commons search failed for ${record.id}: HTTP ${response.status}`);
  const pages = (await response.json()).query?.pages ?? [];
  return pages.map((page) => {
    const info = page.imageinfo?.[0];
    return {
      title: page.title,
      width: info?.width,
      height: info?.height,
      mime: info?.mime,
      thumbUrl: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(page.title.replace(/^File:/, ''))}?width=480`,
      sourceUrl: info?.descriptionurl,
      license: info?.extmetadata?.LicenseShortName?.value ?? '',
      creator: String(info?.extmetadata?.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim()
    };
  }).filter((item) => item.thumbUrl && item.width >= (record.status === 'lost' ? 800 : 1200) && /^image\/(?:jpeg|png|webp)$/.test(item.mime) && acceptedLicense.test(item.license)).slice(0, 8);
}

async function download(url) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Preview failed: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function labelSvg(index, candidate) {
  const title = candidate.title.replace(/^File:/, '').slice(0, 58);
  return Buffer.from(`<svg width="480" height="82" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="82" fill="#10100f"/>
    <text x="14" y="25" fill="#8cc9b5" font-family="Arial" font-size="17" font-weight="700">${index + 1}</text>
    <text x="45" y="25" fill="white" font-family="Arial" font-size="14">${escapeXml(title)}</text>
    <text x="45" y="51" fill="#b9b8b1" font-family="Arial" font-size="12">${candidate.width}×${candidate.height} · ${escapeXml(candidate.license)}</text>
    <text x="45" y="70" fill="#8d8c86" font-family="Arial" font-size="11">${escapeXml(candidate.creator.slice(0, 62) || 'Unknown creator')}</text>
  </svg>`);
}

async function makeSheet(record, candidates) {
  const output = join(REVIEW, `${String(record.order).padStart(2, '0')}-${record.id}.jpg`);
  try {
    await access(output);
    return;
  } catch {}
  const cellWidth = 480;
  const cellHeight = 382;
  const header = 70;
  const sheet = sharp({ create: { width: cellWidth * 2, height: header + cellHeight * 4, channels: 3, background: '#e9e9e6' } });
  const composites = [{
    input: Buffer.from(`<svg width="960" height="70" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="70" fill="#245f56"/><text x="22" y="30" fill="white" font-family="Arial" font-size="23" font-weight="700">${escapeXml(String(record.order).padStart(2, '0'))} · ${escapeXml(record.name.en)}</text><text x="22" y="54" fill="#d6ede5" font-family="Arial" font-size="13">${escapeXml(record.location.en)} · ${candidates.length} licensed candidates</text></svg>`),
    left: 0, top: 0
  }];
  const previews = [];
  for (let start = 0; start < candidates.length; start += 4) {
    const batch = candidates.slice(start, start + 4);
    previews.push(...await Promise.all(batch.map(async (candidate) => {
      try {
        return await sharp(await download(candidate.thumbUrl)).resize(450, 286, { fit: 'contain', background: '#d7d6d1' }).jpeg({ quality: 82 }).toBuffer();
      } catch {
        return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="450" height="286"><rect width="450" height="286" fill="#d7d6d1"/><text x="225" y="143" text-anchor="middle" fill="#52514d" font-family="Arial" font-size="15">Preview unavailable</text></svg>');
      }
    })));
  }
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const left = (index % 2) * cellWidth;
    const top = header + Math.floor(index / 2) * cellHeight;
    composites.push({ input: previews[index], left: left + 15, top: top + 8 });
    composites.push({ input: labelSvg(index, candidate), left, top: top + 300 });
  }
  await sheet.composite(composites).jpeg({ quality: 88 }).toFile(output);
}

await mkdir(REVIEW, { recursive: true });
const requestedIds = new Set(process.argv.slice(2));
let all = {};
try {
  all = JSON.parse(await readFile(join(REVIEW, 'candidates.json'), 'utf8'));
} catch {}
for (const record of WONDERS) {
  if (requestedIds.size && !requestedIds.has(record.id)) continue;
  let candidates = [];
  try {
    candidates = await searchCommons(record);
  } catch (error) {
    process.stderr.write(`${record.id}: ${error.message}\n`);
  }
  all[record.id] = candidates;
  await makeSheet(record, candidates);
  process.stdout.write(`${record.order}/37 ${record.id}: ${candidates.length}\n`);
  await wait(350);
}
await writeFile(join(REVIEW, 'candidates.json'), JSON.stringify(all, null, 2));
