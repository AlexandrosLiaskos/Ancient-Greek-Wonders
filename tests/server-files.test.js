import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OPTIONAL, REQUIRED } from '../scripts/prepare-pages.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUNTIME = [...REQUIRED, ...OPTIONAL];
const NOT_RELEASED = new Set(['.git', 'node_modules', '_site']);

// Locations of infra/nginx.conf in the order nginx selects them: an exact match
// first, then the first matching regular expression, then the prefix "/".
async function serverLocations() {
  const conf = await readFile(new URL('../infra/nginx.conf', import.meta.url), 'utf8');
  const exact = new Set([...conf.matchAll(/location\s+=\s+(\S+)\s*\{/g)].map((match) => match[1]));
  const regex = [...conf.matchAll(/location\s+(~\*?)\s+(?:"([^"]+)"|(\S+))\s*\{([^}]*)\}/g)].map((match) => ({
    pattern: new RegExp(match[2] ?? match[3], match[1] === '~*' ? 'i' : ''),
    answers404: /^\s*return 404;\s*$/.test(match[4])
  }));
  return { exact, regex };
}

function answers404({ exact, regex }, path) {
  if (exact.has(path)) return false;
  const first = regex.find((location) => location.pattern.test(path));
  return Boolean(first?.answers404);
}

async function repositoryFiles(dir = ROOT) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (dir === ROOT && NOT_RELEASED.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await repositoryFiles(path));
    else files.push(`/${relative(ROOT, path).split(sep).join('/')}`);
  }
  return files;
}

const isRuntime = (path) => RUNTIME.some((entry) => path === `/${entry}` || path.startsWith(`/${entry}/`));

test('VPS server answers 404 for every repository file outside the Pages runtime set', async () => {
  const locations = await serverLocations();
  const files = await repositoryFiles();
  assert.ok(files.includes('/index.html'));
  assert.deepEqual(files.filter((path) => !isRuntime(path) && !answers404(locations, path)), []);
  assert.deepEqual(files.filter((path) => isRuntime(path) && answers404(locations, path)), []);
});

test('VPS server keeps the site, the credits and the visit counter reachable', async () => {
  const locations = await serverLocations();
  const hidden = [
    '/infra/', '/infra/nginx.conf', '/infra/compose.prod.yaml', '/infra/visit_counter.py', '/infra/scripts/ship.ps1',
    '/.github/workflows/pages.yml', '/.gitignore', '/package.json', '/package-lock.json', '/tests/', '/tests/map.test.js',
    '/scripts/prepare-pages.mjs', '/docs/', '/media/manifest.json', '/README.md', '/DESIGN.md', '/PRODUCT.md',
    '/node_modules/example/index.js'
  ];
  const served = [
    '/', '/index.html', '/styles.css', '/src/app.js', '/assets/fonts/gfs-solomos.woff2', '/assets/fonts/OFL-GFS-Solomos.txt',
    '/ATTRIBUTIONS.md', '/LICENSE', '/api/page-summary', '/api/visit', '/.well-known/acme-challenge/check'
  ];
  for (const path of hidden) assert.equal(answers404(locations, path), true, path);
  for (const path of served) assert.equal(answers404(locations, path), false, path);
});
