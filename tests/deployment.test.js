import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('static entry uses repository-relative local assets and WebGIS components', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
  assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/);
  assert.match(html, /id="mobile-filters-toggle"/);
  assert.match(html, /id="sidebar"/);
  assert.match(html, /class="tab-nav"/);
  assert.match(html, /data-tab="filters"/);
  assert.match(html, /data-tab="search"/);
  assert.match(html, /data-tab="stats"/);
  assert.match(html, /id="welcome-modal"/);
  assert.match(html, /id="feature-guide-modal"/);
  assert.match(html, /id="references-modal"/);
  assert.match(html, /id="wonder-modal"/);
  assert.match(html, /id="fbc-picker-btn"/);
  assert.match(html, /id="fbc-variable-modal"/);
  assert.match(html, /id="fbc-content"/);
  assert.match(html, /id="clear-filters"/);
  assert.match(html, /family=Italianno/);
  assert.match(css, /\.masthead h1[^}]*font-family:\s*'Italianno'/s);
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

test('VPS deployment and repository documentation exist', async () => {
  await Promise.all([
    access(new URL('../README.md', import.meta.url)),
    access(new URL('../LICENSE', import.meta.url)),
    access(new URL('../.gitignore', import.meta.url))
  ]);
});
