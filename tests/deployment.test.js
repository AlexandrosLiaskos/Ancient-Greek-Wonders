import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('static entry uses repository-relative local assets', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
  assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/);
  assert.match(html, /class="mobile-action-bar"/);
  assert.match(html, /class="[^"]*workbench[^"]*"/);
  assert.match(html, /id="map-preview-region"/);
});

test('GitHub Pages workflow and repository documentation exist', async () => {
  await Promise.all([
    access(new URL('../.github/workflows/pages.yml', import.meta.url)),
    access(new URL('../README.md', import.meta.url)),
    access(new URL('../LICENSE', import.meta.url)),
    access(new URL('../.gitignore', import.meta.url))
  ]);
});
