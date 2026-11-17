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

test('VPS server leaves self-identified robots out of the visit count', async () => {
  const conf = await readFile(new URL('../infra/nginx.conf', import.meta.url), 'utf8');
  const map = conf.match(/map \$http_user_agent \$visit_robot_agent \{([^}]*)\}/);
  assert.ok(map, 'map $visit_robot_agent');
  assert.match(map[1], /^\s*"" 1;$/m, 'an empty user agent counts as a robot');
  assert.match(conf, /map "\$request_method:\$visit_robot_agent" \$visit_automated_post \{\s*default 0;\s*"POST:1" 1;\s*\}/);
  const robot = new RegExp(map[1].match(/"~\*([^"]+)" 1;/)[1], 'i');
  const robots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot)',
    'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/142.0.0.0 Safari/537.36',
    'curl/8.14.1',
    'python-requests/2.32.5'
  ];
  const people = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
  ];
  for (const agent of robots) assert.equal(robot.test(agent), true, agent);
  for (const agent of people) assert.equal(robot.test(agent), false, agent);
  const counting = [...conf.matchAll(/location\s+=\s+(\S+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)]
    .filter((match) => match[2].includes('proxy_pass http://$visit_counter'));
  assert.deepEqual(counting.map((match) => match[1]), ['/api/page-summary', '/api/visit']);
  for (const [, path, body] of counting) {
    assert.match(body, /^\s*if \(\$visit_automated_post\) \{ return 204; \}$/m, path);
  }
});
