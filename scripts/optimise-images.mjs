#!/usr/bin/env node
/**
 * Idempotent WebP image optimiser for Decbricks assets.
 *
 * Converts raster images (png, jpg, jpeg, bmp, tiff, avif, static gif) to WebP
 * using sharp (quality 80, effort 6, lossy, alpha preserved, sRGB colour profile,
 * non-colour metadata stripped, original pixel dimensions retained).
 *
 * Usage:
 *   node scripts/optimise-images.mjs --input <dir|file> [--output <dir>]
 *     [--quality 80] [--effort 6] [--reencode-webp] [--overwrite] [--json]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const CONVERTIBLE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif', '.avif', '.gif']);
const ALL_RASTER_EXTS = new Set([...CONVERTIBLE_EXTS, '.webp']);

function parseArgs(argv) {
  const opts = {
    input: '',
    output: '',
    quality: 80,
    effort: 6,
    reencodeWebp: false,
    overwrite: false,
    recursive: true,
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') opts.input = argv[++i] || '';
    else if (arg === '--output' || arg === '-o') opts.output = argv[++i] || '';
    else if (arg === '--quality' || arg === '-q') opts.quality = Number(argv[++i] || 80);
    else if (arg === '--effort' || arg === '-e') opts.effort = Number(argv[++i] || 6);
    else if (arg === '--reencode-webp') opts.reencodeWebp = true;
    else if (arg === '--overwrite') opts.overwrite = true;
    else if (arg === '--no-recursive') opts.recursive = false;
    else if (arg === '--json') opts.json = true;
    else if (!arg.startsWith('-') && !opts.input) opts.input = arg;
  }

  return opts;
}

function toKebabBase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function collectFiles(targetPath, recursive) {
  const stat = await fs.stat(targetPath);
  if (stat.isFile()) return [targetPath];

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (recursive) files.push(...(await collectFiles(full, recursive)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALL_RASTER_EXTS.has(ext)) files.push(full);
    }
  }
  return files.sort();
}

async function encodeWebpBuffer(srcPath, { quality, effort }) {
  const pipeline = sharp(srcPath, { failOn: 'none' }).toColorspace('srgb').withIccProfile('srgb');
  return pipeline
    .webp({
      quality,
      effort,
      lossless: false,
    })
    .toBuffer({ resolveWithObject: true });
}

async function optimiseFile(srcPath, inputRoot, outputRoot, opts) {
  const ext = path.extname(srcPath).toLowerCase();
  const baseName = path.basename(srcPath, ext);
  const relDir = inputRoot === srcPath ? '' : path.relative(inputRoot, path.dirname(srcPath));
  const outDir = outputRoot ? path.join(outputRoot, relDir) : path.dirname(srcPath);
  const kebabName = toKebabBase(baseName) || baseName.toLowerCase();
  const targetWebp = path.join(outDir, `${kebabName}.webp`);

  const srcStat = await fs.stat(srcPath);
  const meta = await sharp(srcPath, { failOn: 'none' }).metadata();

  if ((meta.pages ?? 1) > 1) {
    return {
      status: 'skipped-animated',
      srcPath,
      targetPath: srcPath,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      originalBytes: srcStat.size,
      newBytes: srcStat.size,
      note: `Animated image (${meta.pages} frames); left unconverted.`,
    };
  }

  if (ext === '.webp' && !opts.reencodeWebp) {
    // Already WebP — copy if writing into a separate output directory, otherwise skip idempotently.
    if (path.resolve(srcPath) !== path.resolve(targetWebp)) {
      await fs.mkdir(outDir, { recursive: true });
      try {
        await fs.access(targetWebp);
        if (!opts.overwrite) {
          const ex = await fs.stat(targetWebp);
          return {
            status: 'skipped-existing',
            srcPath,
            targetPath: targetWebp,
            width: meta.width ?? 0,
            height: meta.height ?? 0,
            originalBytes: srcStat.size,
            newBytes: ex.size,
          };
        }
      } catch {}
      await fs.copyFile(srcPath, targetWebp);
      return {
        status: 'copied-webp',
        srcPath,
        targetPath: targetWebp,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        originalBytes: srcStat.size,
        newBytes: srcStat.size,
      };
    }

    return {
      status: 'skipped-webp',
      srcPath,
      targetPath: srcPath,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      originalBytes: srcStat.size,
      newBytes: srcStat.size,
    };
  }

  if (!opts.overwrite && ext !== '.webp') {
    try {
      const existing = await fs.stat(targetWebp);
      return {
        status: 'skipped-existing',
        srcPath,
        targetPath: targetWebp,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        originalBytes: srcStat.size,
        newBytes: existing.size,
      };
    } catch {}
  }

  const { data, info } = await encodeWebpBuffer(srcPath, opts);
  const newBytes = data.byteLength;

  if (newBytes >= srcStat.size) {
    // Do not keep a WebP that is equal or larger than the original.
    const fallbackTarget = path.join(outDir, `${kebabName}${ext}`);
    await fs.mkdir(outDir, { recursive: true });
    if (path.resolve(srcPath) !== path.resolve(fallbackTarget)) {
      await fs.copyFile(srcPath, fallbackTarget);
    }
    return {
      status: 'kept-original-smaller',
      srcPath,
      targetPath: fallbackTarget,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      originalBytes: srcStat.size,
      newBytes: srcStat.size,
      candidateWebpBytes: newBytes,
      note: `WebP output (${newBytes} B) >= original (${srcStat.size} B); kept original format.`,
    };
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(targetWebp, data);

  const warnings = [];
  const width = info.width ?? meta.width ?? 0;
  if (width > 2000) warnings.push(`width ${width}px > 2000px`);
  if (newBytes > 500 * 1024) warnings.push(`size ${(newBytes / 1024).toFixed(1)} KB > 500 KB`);

  return {
    status: ext === '.webp' ? 'reencoded-webp' : 'converted',
    srcPath,
    targetPath: targetWebp,
    width,
    height: info.height ?? meta.height ?? 0,
    originalBytes: srcStat.size,
    newBytes,
    warnings,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.input) {
    console.error(
      'Usage: node scripts/optimise-images.mjs --input <dir|file> [--output <dir>] [--quality 80] [--effort 6] [--reencode-webp] [--overwrite] [--json]'
    );
    process.exit(1);
  }

  const inputAbs = path.resolve(opts.input);
  const outputAbs = opts.output ? path.resolve(opts.output) : '';
  const files = await collectFiles(inputAbs, opts.recursive);

  const results = [];
  for (const file of files) {
    results.push(await optimiseFile(file, inputAbs, outputAbs, opts));
  }

  if (opts.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  for (const r of results) {
    const pct =
      r.originalBytes > 0 ? (((r.newBytes - r.originalBytes) / r.originalBytes) * 100).toFixed(1) : '0.0';
    const warnStr = r.warnings?.length ? ` [WARN: ${r.warnings.join(', ')}]` : '';
    console.log(
      `[${r.status}] ${path.relative(process.cwd(), r.srcPath)} -> ${path.relative(process.cwd(), r.targetPath)} (${r.originalBytes} B -> ${r.newBytes} B, ${pct}%)${warnStr}${r.note ? ` — ${r.note}` : ''}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
