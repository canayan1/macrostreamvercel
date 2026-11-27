// Puts a Desk Signal desktop release on the download page.
//
//   node yerel/desk-signal-release.mjs <version> <folder with the .dmg and/or the -setup.exe>
//
// The folder is what the kalibre-lab "Desk Signal desktop" workflow uploads (both artifacts in one
// folder), or a local build folder with only one of them. Copies each installer it finds to
// static/downloads/desk-signal/<version>/ under a plain name, checks it against the workflow's
// SHA256SUMS files when present, and writes latest.json, which yerel/product-pages.py reads to
// build /desk-signal/download. A system without a file shows "opens here soon" on that page.
// Run product-pages.py afterwards.

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, copyFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const [version, from] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || !from) {
  console.error('usage: node yerel/desk-signal-release.mjs <version, e.g. 0.1.0> <folder>');
  process.exit(1);
}

const names = await readdir(from, { recursive: true });
const pick = test => {
  const found = names.filter(test);
  if (found.length > 1) throw new Error(`expected at most one match in ${from}, found ${found.length}: ${found.join(', ')}`);
  return found[0];
};
const sources = Object.fromEntries(Object.entries({
  mac: pick(n => n.endsWith('.dmg')),
  windows: pick(n => n.endsWith('-setup.exe')),
}).filter(([, v]) => v));
if (!Object.keys(sources).length) throw new Error(`no .dmg or -setup.exe in ${from}`);
const target = { mac: `Desk-Signal-${version}-mac.dmg`, windows: `Desk-Signal-${version}-windows-setup.exe` };

// The workflow's own checksums, keyed by file name, to catch a file changed on the way here.
const expected = new Map();
for (const n of names.filter(n => /SHA256SUMS.*\.txt$/.test(n))) {
  for (const line of (await readFile(join(from, n), 'utf8')).split('\n')) {
    const m = line.match(/^([0-9a-f]{64})\s+\*?(.+)$/);
    if (m) expected.set(m[2].trim().split(/[\\/]/).pop(), m[1]);
  }
}

const dir = join(ROOT, 'static', 'downloads', 'desk-signal', version);
await mkdir(dir, { recursive: true });
const files = [];
for (const os of Object.keys(sources)) {
  const src = join(from, sources[os]);
  const data = await readFile(src);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const want = expected.get(sources[os].split(/[\\/]/).pop());
  if (want && want !== sha256) throw new Error(`${sources[os]}: SHA-256 differs from the build's checksum file`);
  await copyFile(src, join(dir, target[os]));
  files.push({ os, name: target[os], url: `/static/downloads/desk-signal/${version}/${target[os]}`, bytes: (await stat(src)).size, sha256 });
  console.log(`${target[os]}  ${sha256}${want ? '  (matches the build)' : ''}`);
}

await writeFile(join(dir, 'SHA256SUMS'), files.map(f => `${f.sha256}  ${f.name}`).join('\n') + '\n');
const manifest = { product: 'desk-signal', version, date: new Date().toISOString().slice(0, 10), beta: true, files };
await writeFile(join(ROOT, 'static', 'downloads', 'desk-signal', 'latest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('latest.json written; now run: python3 yerel/product-pages.py');
