import { cp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const release = join(root, 'release');
const assets = join(release, 'assets');
await mkdir(assets, { recursive: true });
await build({entryPoints:['native-storage.js'], bundle:true, outfile:'native-storage.bundle.js', format:'iife', target:'es2020'});
for (const file of ['ui-preview.html', 'manifest.webmanifest', 'sw.js', 'course-progress.js', 'app.js', 'learning-tools.js', 'learning-tools.css', 'native-storage.bundle.js']) {
  await cp(join(root, file), join(release, file));
}
const html = await readFile(join(root, 'ui-preview.html'), 'utf8');
await writeFile(join(release, 'index.html'), html, 'utf8');
for (const [name, url] of Object.entries({
  'lucide.min.js': 'https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js',
  'mountains.jpg': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=85',
  'forest.jpg': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1100&q=85'
})) {
  try { if ((await stat(join(assets, name))).size > 0) continue; } catch {}
  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await writeFile(join(assets, name), Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    throw new Error(`Asset unavailable: ${name}; ${error.message}`);
  }
}
for (const name of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
  if (!(await stat(join(release, name))).size) throw new Error(`Missing icon: ${name}`);
}
const localHtml = html
  .replaceAll('https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js', './assets/lucide.min.js')
  .replaceAll('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=85', './assets/mountains.jpg')
  .replaceAll('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1100&q=85', './assets/forest.jpg');
await writeFile(join(release, 'index.html'), localHtml, 'utf8');
await writeFile(join(release, 'ui-preview.html'), localHtml, 'utf8');
let app = await readFile(join(root, 'app.js'), 'utf8');
app = app.replaceAll('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=85', './assets/mountains.jpg')
  .replaceAll('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1100&q=85', './assets/forest.jpg');
await writeFile(join(release, 'app.js'), app, 'utf8');
console.log('Web release built:', release);
