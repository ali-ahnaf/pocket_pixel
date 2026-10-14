#!/usr/bin/env node
// Check, preview and register 16x16 pixel sprites for packages/app. No dependencies.
//
//   node pixel-icons.js check <batch.js> [out.png]   validate a batch and render it to a PNG (8x, 6 per row)
//   node pixel-icons.js add <batch.js>               validate, merge into src/lib/pixelIcons.ts, run prettier
//   node pixel-icons.js sheet [Name ...] [--out f]   render sprites already in pixelIcons.ts (all if no names)
//   node pixel-icons.js list                         print the sprite names already in pixelIcons.ts
//
// A batch is a CommonJS file: module.exports = { Name: { palette: { a: '#rrggbb' }, rows: [16 strings of 16 chars] } }
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const GRID = 16;
const MAX_KEYS = 6; // including the built-in k and w
const BUILTIN = { k: '#0e0e10', w: '#ffffff' };
const REPO = path.resolve(__dirname, '../../../..');
const TARGET = path.join(REPO, 'packages/app/src/lib/pixelIcons.ts');
const NAME_RE = /^[A-Z][A-Za-z0-9]*$/;

function validate(sprites) {
  const errors = [];
  for (const [name, sprite] of Object.entries(sprites)) {
    const { palette = {}, rows = [] } = sprite;
    if (!NAME_RE.test(name)) errors.push(`${name}: name must be PascalCase (match the lucide icon name)`);
    if (rows.length !== GRID) errors.push(`${name}: ${rows.length} rows, need ${GRID}`);
    for (const key of Object.keys(palette)) {
      if (key === 'k' || key === 'w' || key === '.' || key.length !== 1) errors.push(`${name}: bad palette key '${key}' (k, w and . are reserved, keys are one character)`);
      if (!/^#[0-9a-fA-F]{6}$/.test(palette[key])) errors.push(`${name}: palette '${key}' must be #rrggbb`);
    }
    const used = new Set();
    rows.forEach((row, y) => {
      if (row.length !== GRID) errors.push(`${name}: row ${y} has ${row.length} chars, need ${GRID}`);
      for (const [x, ch] of [...row].entries()) {
        if (ch === '.') continue;
        if (!BUILTIN[ch] && !palette[ch]) errors.push(`${name}: unknown key '${ch}' at ${x},${y}`);
        used.add(ch);
      }
    });
    if (used.size === 0) errors.push(`${name}: empty sprite`);
    if (used.size > MAX_KEYS) errors.push(`${name}: ${used.size} colors, max ${MAX_KEYS} including k and w`);
    if (!used.has('k')) errors.push(`${name}: no 'k' outline pixels`);
  }
  return errors;
}

function loadBatch(file) {
  const abs = path.resolve(file);
  delete require.cache[abs];
  return require(abs);
}

function loadExisting() {
  if (!fs.existsSync(TARGET)) return {};
  const src = fs.readFileSync(TARGET, 'utf8');
  const start = src.indexOf('export const PIXEL_ICONS = {');
  const end = src.indexOf('} satisfies Record<string, PixelSprite>');
  if (start < 0 || end < 0) throw new Error('pixelIcons.ts has an unexpected layout; edit it by hand');
  return new Function(`return {${src.slice(src.indexOf('{', start) + 1, end)}}`)();
}

function writeTarget(all) {
  const body = Object.keys(all)
    .sort()
    .map((name) => {
      const { palette, rows } = all[name];
      const pal = Object.entries(palette).map(([k, v]) => `${k}: '${v.toLowerCase()}'`).join(', ');
      return `  ${name}: {\n    palette: { ${pal} },\n    rows: [\n${rows.map((r) => `      '${r}',`).join('\n')}\n    ],\n  },`;
    })
    .join('\n');
  const head = `// 16x16 pixel-art sprites drawn as text grids. '.' is transparent; every other character is a palette key.
// 'k' (outline) and 'w' (highlight) are shared by all sprites; each sprite adds its own few shades in \`palette\`.
// Names match the lucide icon names stored on vaults and tags (see AVAILABLE_ICONS), plus UI-only icons.
// These colors are sprite art, not theme tokens.

export interface PixelSprite {
  readonly palette: Readonly<Record<string, string>>;
  readonly rows: readonly string[];
}

export const SPRITE_OUTLINE = '#0e0e10';
export const SPRITE_HIGHLIGHT = '#ffffff';

export const PIXEL_ICONS = {
`;
  fs.writeFileSync(TARGET, `${head}${body}\n} satisfies Record<string, PixelSprite>;\n\nexport type PixelIconName = keyof typeof PIXEL_ICONS;\n`);
}

function renderPng(sprites, out) {
  const names = Object.keys(sprites);
  const S = 8, PAD = 8, COLS = 6;
  const cell = GRID * S + PAD * 2;
  const W = Math.min(COLS, names.length) * cell;
  const H = Math.ceil(names.length / COLS) * cell;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const bgs = [hex('#201f22'), hex('#2a292c')]; // app surface colors, checkerboard so light and dark edges both show
  const px = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px.set(bgs[(Math.floor(x / cell) + Math.floor(y / cell)) % 2], (y * W + x) * 3);
  names.forEach((name, i) => {
    const { palette, rows } = sprites[name];
    const pal = { ...BUILTIN, ...palette };
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.' || !pal[ch]) return;
        const c = hex(pal[ch]);
        const ox = (i % COLS) * cell + PAD + x * S;
        const oy = Math.floor(i / COLS) * cell + PAD + y * S;
        for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) px.set(c, ((oy + dy) * W + ox + dx) * 3);
      });
    });
  });
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const v of b) c = table[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  const order = names.map((n, i) => `${i % COLS === 0 ? '\nrow ' + Math.floor(i / COLS) + ': ' : ''}${n}`).join(', ').replace(/, \nrow/g, '\nrow');
  console.log(`${order}\n\n${names.length} sprite(s) -> ${out}`);
}

function fail(errors) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} error(s), nothing written`);
  process.exit(1);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'check') {
  if (!args[0]) fail(['usage: check <batch.js> [out.png]']);
  const sprites = loadBatch(args[0]);
  const errors = validate(sprites);
  renderPng(sprites, path.resolve(args[1] || args[0].replace(/\.js$/, '.png')));
  if (errors.length) fail(errors);
  console.log('valid');
} else if (cmd === 'add') {
  if (!args[0]) fail(['usage: add <batch.js>']);
  const sprites = loadBatch(args[0]);
  const errors = validate(sprites);
  if (errors.length) fail(errors);
  const all = loadExisting();
  const replaced = Object.keys(sprites).filter((n) => all[n]);
  Object.assign(all, sprites);
  writeTarget(all);
  execSync(`npx prettier --write ${JSON.stringify(TARGET)}`, { cwd: REPO, stdio: 'ignore' });
  console.log(`added ${Object.keys(sprites).length - replaced.length}, replaced ${replaced.length}${replaced.length ? ` (${replaced.join(', ')})` : ''}; ${Object.keys(all).length} total in ${path.relative(REPO, TARGET)}`);
} else if (cmd === 'sheet') {
  const outIdx = args.indexOf('--out');
  const out = path.resolve(outIdx >= 0 ? args[outIdx + 1] : 'pixel-icons-sheet.png');
  const names = args.filter((a, i) => a !== '--out' && i !== outIdx + 1);
  const all = loadExisting();
  const pick = names.length ? names : Object.keys(all);
  const missing = pick.filter((n) => !all[n]);
  if (missing.length) fail([`no such sprite: ${missing.join(', ')}`]);
  renderPng(Object.fromEntries(pick.map((n) => [n, all[n]])), out);
} else if (cmd === 'list') {
  console.log(Object.keys(loadExisting()).sort().join('\n'));
} else {
  console.error('usage: pixel-icons.js check|add|sheet|list (see header of this file)');
  process.exit(1);
}
