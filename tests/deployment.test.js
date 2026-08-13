import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('static entry uses repository-relative local assets', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
  assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/);
  assert.match(html, /class="mobile-action-bar"/);
  assert.match(html, /class="[^"]*workbench[^"]*"/);
  assert.match(html, /id="map-preview-region"/);
  assert.match(html, /class="tool-tabs"/);
  assert.match(html, /data-tab="browse"/);
  assert.match(html, /data-tab="filters"/);
  assert.match(html, /data-mobile-tab="browse"/);
  assert.match(html, /data-mobile-tab="filters"/);
  assert.match(html, /<section class="map-stage"[\s\S]*id="map-legend"/);
  assert.match(html, /family=Italianno/);
  assert.match(css, /\.masthead h1[^}]*font-family:\s*'Italianno'/s);
  assert.doesNotMatch(html, /masthead-kicker/);
  assert.doesNotMatch(html, /data-i18n="(?:atlasRegister|filterBy|findMonument)"/);
});

test('Greek masthead ships its calligraphic face with the static site', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  await Promise.all([
    access(new URL('../assets/fonts/gfs-solomos.woff2', import.meta.url)),
    access(new URL('../assets/fonts/OFL-GFS-Solomos.txt', import.meta.url))
  ]);
  assert.doesNotMatch(html, /family=GFS\+Didot/);
  assert.match(css, /@font-face\s*{[^}]*font-family:\s*'GFS Solomos'[^}]*url\(['"]\.\/assets\/fonts\/gfs-solomos\.woff2['"]\)/s);
  assert.match(css, /html\[lang="el"\] \.masthead h1[^}]*font-family:\s*'GFS Solomos'/s);
});

test('GitHub Pages workflow and repository documentation exist', async () => {
  await Promise.all([
    access(new URL('../.github/workflows/pages.yml', import.meta.url)),
    access(new URL('../README.md', import.meta.url)),
    access(new URL('../LICENSE', import.meta.url)),
    access(new URL('../.gitignore', import.meta.url))
  ]);
});
