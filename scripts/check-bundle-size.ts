import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const INITIAL_CHUNK_LIMIT = 300 * 1024;
const ANY_CHUNK_LIMIT = 500 * 1024;
const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');

interface BundleAsset {
  file: string;
  bytes: number;
  gzipBytes: number;
}

const formatKiB = (bytes: number) => `${(bytes / 1024).toFixed(2)} KiB`;

const collectJavaScriptAssets = async () => {
  const assetsRoot = resolve(distRoot, 'assets');
  const filenames = await readdir(assetsRoot);
  const assets: BundleAsset[] = [];

  for (const filename of filenames) {
    if (!filename.endsWith('.js')) continue;
    const filePath = resolve(assetsRoot, filename);
    const fileStat = await stat(filePath);
    const content = await readFile(filePath);
    assets.push({
      file: `assets/${filename}`,
      bytes: fileStat.size,
      gzipBytes: gzipSync(content).length
    });
  }

  return assets.sort((left, right) => right.bytes - left.bytes);
};

const findInitialEntry = async (assets: BundleAsset[]) => {
  const indexHtml = await readFile(resolve(distRoot, 'index.html'), 'utf8');
  const moduleScript = Array.from(indexHtml.matchAll(/<script\b[^>]*>/g))
    .map(match => match[0])
    .find(tag => /\btype=["']module["']/.test(tag));
  const sourceMatch = moduleScript?.match(/\bsrc=["']([^"']+\.js)["']/);
  if (!sourceMatch) {
    throw new Error('Unable to identify the initial module script in dist/index.html');
  }

  const entryPath = sourceMatch[1].replace(/^\.?\//, '');
  const entry = assets.find(asset => asset.file === entryPath);
  if (!entry) {
    throw new Error(`Initial module script is missing from dist: ${entryPath}`);
  }
  return entry;
};

const main = async () => {
  const assets = await collectJavaScriptAssets();
  if (assets.length === 0) {
    throw new Error('No JavaScript assets found. Run npm run build first.');
  }

  const initialEntry = await findInitialEntry(assets);
  const oversizedAssets = assets.filter(asset => asset.bytes > ANY_CHUNK_LIMIT);

  console.log('Bundle size report:');
  console.log(`- Initial entry: ${initialEntry.file} (${formatKiB(initialEntry.bytes)}, gzip ${formatKiB(initialEntry.gzipBytes)})`);
  console.log(`- Largest chunk: ${assets[0].file} (${formatKiB(assets[0].bytes)}, gzip ${formatKiB(assets[0].gzipBytes)})`);
  console.log(`- JavaScript chunks: ${assets.length}`);
  console.log(`- Total JavaScript: ${formatKiB(assets.reduce((sum, asset) => sum + asset.bytes, 0))}`);

  const errors: string[] = [];
  if (initialEntry.bytes > INITIAL_CHUNK_LIMIT) {
    errors.push(
      `Initial entry exceeds ${formatKiB(INITIAL_CHUNK_LIMIT)}: ${formatKiB(initialEntry.bytes)}`
    );
  }
  for (const asset of oversizedAssets) {
    errors.push(
      `${asset.file} exceeds the per-chunk limit of ${formatKiB(ANY_CHUNK_LIMIT)}: ${formatKiB(asset.bytes)}`
    );
  }

  if (errors.length > 0) {
    console.error('Bundle size check failed:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Bundle size check passed.');
};

await main();
