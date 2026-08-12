import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { preparePages } from '../scripts/prepare-pages.mjs';

test('Pages artifact includes runtime files and excludes development files', async (t) => {
  const fixture = await mkdtemp(join(tmpdir(), 'wonders-pages-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const output = join(fixture, '_site');

  await Promise.all([
    mkdir(join(fixture, 'src'), { recursive: true }),
    mkdir(join(fixture, 'assets', 'images'), { recursive: true }),
    mkdir(join(fixture, 'node_modules', 'example'), { recursive: true })
  ]);
  await Promise.all([
    writeFile(join(fixture, 'index.html'), '<h1>Atlas</h1>'),
    writeFile(join(fixture, '404.html'), '404'),
    writeFile(join(fixture, 'styles.css'), 'body{}'),
    writeFile(join(fixture, 'LICENSE'), 'MIT'),
    writeFile(join(fixture, 'src', 'app.js'), 'export {};'),
    writeFile(join(fixture, 'assets', 'images', 'hero.jpg'), 'image'),
    writeFile(join(fixture, 'package.json'), '{}'),
    writeFile(join(fixture, 'node_modules', 'example', 'index.js'), 'large')
  ]);

  await preparePages(fixture, output);

  assert.equal(await readFile(join(output, 'index.html'), 'utf8'), '<h1>Atlas</h1>');
  await access(join(output, 'src', 'app.js'));
  await access(join(output, 'assets', 'images', 'hero.jpg'));
  await assert.rejects(access(join(output, 'package.json')));
  await assert.rejects(access(join(output, 'node_modules')));
});
