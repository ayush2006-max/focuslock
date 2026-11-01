// Verifies the LV3 build: manifest.json, popup/, blocked/, icons/ are copied
// next to the compiled TS output so dist/ can be loaded via chrome://extensions.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function copy(from, to) {
  const src = path.join(root, from);
  const dest = path.join(dist, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(from, to) {
  const src = path.join(root, from);
  const dest = path.join(dist, to);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory()) copyDir(path.join(from, entry.name), path.join(to, entry.name));
    else copy(path.join(from, entry.name), path.join(to, entry.name));
  }
}

copy('manifest.json', 'manifest.json');
copyDir('popup', 'popup');
copyDir('blocked', 'blocked');
copyDir('icons', 'icons');

const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'));
const required = [
  'src/background/index.js',
  'src/content/bridge.js',
  'popup/popup.html',
  'blocked/blocked.html',
];
for (const file of required) {
  if (!fs.existsSync(path.join(dist, file))) {
    throw new Error(`Build output missing: dist/${file}`);
  }
}
console.log('FocusLock extension built successfully -> extension/dist');
console.log(`Manifest v${manifest.version}`);
