#!/usr/bin/env node
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');
const distDir = resolve(packageRoot, 'dist');

mkdirSync(distDir, { recursive: true });

for (const filename of ['tour.css', 'tour-utilities.css']) {
  copyFileSync(resolve(packageRoot, 'src', filename), resolve(distDir, filename));
}
