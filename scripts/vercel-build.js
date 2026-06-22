#!/usr/bin/env node
'use strict';
// Vercel Build Output API v3 builder.
// Creates .vercel/output/ directly so Vercel skips framework auto-detection.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.vercel', 'output');
const staticDir = path.join(outDir, 'static');
const funcDir = path.join(outDir, 'functions', 'index.func');

// 0. Clean any stale cached output so old functions don't persist
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}

// 1. Build React client
log('Building React client...');
runIn('client', 'npm install');
runIn('client', 'npm run build');

// 2. Static output
log('Copying static files → .vercel/output/static/');
mkdirp(staticDir);
copyDir(j('client', 'dist'), staticDir);

// 3. API function
log('Assembling API function...');
mkdirp(funcDir);

// index.js — entry point with correct relative path inside funcDir
write(j(funcDir, 'index.js'), "module.exports = require('./server');\n");

// Copy server + supporting dirs
copyFile(j(root, 'server.js'), j(funcDir, 'server.js'));
copyDir(j(root, 'routes'), j(funcDir, 'routes'));
copyDir(j(root, 'tools'),  j(funcDir, 'tools'));
copyDir(j(root, 'data'),   j(funcDir, 'data'));
copyFile(j(root, 'package.json'), j(funcDir, 'package.json'));
const lockSrc = j(root, 'package-lock.json');
if (fs.existsSync(lockSrc)) copyFile(lockSrc, j(funcDir, 'package-lock.json'));

log('Installing production dependencies...');
runIn(funcDir, 'npm install --omit=dev --ignore-scripts');

// Vercel function metadata
write(j(funcDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs18.x',
  handler: 'index.js',
  maxDuration: 30
}, null, 2));

// 4. Routing config
// handle:filesystem serves static assets (CDN); remaining requests go to Express function.
// Express receives original URL, so /api/config/status matches app.use('/api/config').
write(j(outDir, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index' }
  ]
}, null, 2));

log('Vercel build complete.');

// ——— helpers ———

function j(...parts) { return path.join(...parts); }
function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function log(msg) { console.log('\n[vercel-build] ' + msg); }
function write(p, content) { fs.writeFileSync(p, content); }

function runIn(cwd, cmd) {
  const abs = path.isAbsolute(cwd) ? cwd : j(root, cwd);
  execSync(cmd, { cwd: abs, stdio: 'inherit' });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  mkdirp(dest);
  for (const item of fs.readdirSync(src)) {
    const s = j(src, item);
    const d = j(dest, item);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
