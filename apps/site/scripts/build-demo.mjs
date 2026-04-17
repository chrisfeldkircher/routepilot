#!/usr/bin/env node
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const siteRoot = resolve(__dirname, '..');
const repoRoot = resolve(siteRoot, '..', '..');
const demoDist = resolve(repoRoot, 'apps', 'demo', 'dist');
const publicDemoDir = resolve(siteRoot, 'public', 'demo');

console.log('[build-demo] Building @routepilot/demo with base=/demo/');
const build = spawnSync('npm', ['run', 'build', '-w', '@routepilot/demo'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: { ...process.env, VITE_PUBLIC_BASE: '/demo/' },
});
if (build.status !== 0) {
  console.error('[build-demo] @routepilot/demo build failed');
  process.exit(build.status ?? 1);
}

if (!existsSync(demoDist) || !statSync(demoDist).isDirectory()) {
  console.error(`[build-demo] Expected build output at ${demoDist}`);
  process.exit(1);
}

console.log(`[build-demo] Copying ${demoDist} -> ${publicDemoDir}`);
rmSync(publicDemoDir, { recursive: true, force: true });
mkdirSync(publicDemoDir, { recursive: true });
cpSync(demoDist, publicDemoDir, { recursive: true });
copyFileSync(resolve(publicDemoDir, 'index.html'), resolve(publicDemoDir, '200.html'));
console.log('[build-demo] Done.');
