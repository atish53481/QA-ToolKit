const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUNDLE_FILE = path.join(__dirname, '../data/templates.json');
// Vercel bundle is read-only — write to /tmp; seed from bundle on cold start
const DATA_FILE = process.env.VERCEL ? '/tmp/qa-templates.json' : BUNDLE_FILE;

function load() {
  if (process.env.VERCEL && !fs.existsSync(DATA_FILE)) {
    try { fs.copyFileSync(BUNDLE_FILE, DATA_FILE); } catch {}
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8').replace(/^﻿/, '');
    return JSON.parse(raw);
  } catch { return []; }
}

function save(templates) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

router.get('/', (req, res) => {
  const { artifactType } = req.query;
  const all = load();
  res.json(artifactType ? all.filter(t => t.artifactType === artifactType) : all);
});

router.post('/', (req, res) => {
  const { name, artifactType, systemPrompt } = req.body;
  if (!name || !artifactType || !systemPrompt) return res.status(400).json({ error: 'name, artifactType, systemPrompt required' });
  const templates = load();
  const { outputFormat } = req.body;
  const template = { id: crypto.randomUUID(), name, artifactType, outputFormat: outputFormat || 'markdown', systemPrompt, builtIn: false, createdAt: new Date().toISOString() };
  templates.push(template);
  save(templates);
  res.json(template);
});

router.put('/:id', (req, res) => {
  const templates = load();
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, systemPrompt, outputFormat } = req.body;
  if (templates[idx].builtIn) {
    // Built-in: only output format is user-configurable
    if (outputFormat) { templates[idx].outputFormat = outputFormat; save(templates); }
    return res.json(templates[idx]);
  }
  if (name) templates[idx].name = name;
  if (systemPrompt) templates[idx].systemPrompt = systemPrompt;
  if (outputFormat) templates[idx].outputFormat = outputFormat;
  save(templates);
  res.json(templates[idx]);
});

router.delete('/:id', (req, res) => {
  const templates = load();
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (templates[idx].builtIn) return res.status(403).json({ error: 'Cannot delete built-in template' });
  templates.splice(idx, 1);
  save(templates);
  res.json({ ok: true });
});

module.exports = router;
