import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED = ['index.html', '404.html', 'styles.css', 'src'];
const OPTIONAL = ['assets', 'ATTRIBUTIONS.md', 'LICENSE'];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function preparePages(root = process.cwd(), output = join(root, '_site')) {
  const rootPath = resolve(root);
  const outputPath = resolve(output);
  const outputRelative = relative(rootPath, outputPath);
  if (!outputRelative || outputRelative.startsWith(`..${sep}`) || basename(outputPath) !== '_site') {
    throw new Error('Pages output must be a _site directory inside the project root.');
  }

  await rm(outputPath, { recursive: true, force: true });
  await mkdir(outputPath, { recursive: true });

  for (const entry of REQUIRED) {
    const source = join(rootPath, entry);
    if (!await exists(source)) throw new Error(`Missing required runtime entry: ${entry}`);
    await cp(source, join(outputPath, entry), { recursive: true });
  }
  for (const entry of OPTIONAL) {
    const source = join(rootPath, entry);
    if (await exists(source)) await cp(source, join(outputPath, entry), { recursive: true });
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) await preparePages();
