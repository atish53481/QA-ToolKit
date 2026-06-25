const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { generateTestStrategy, renderMarkdown: renderStrategy } = require('../tools/testStrategy');
const { generateTestPlan, renderMarkdown: renderPlan } = require('../tools/testPlan');
const { generateTestCases, toCSV } = require('../tools/testCases');
const { generateBugReport, renderMarkdown: renderBugs } = require('../tools/bugReport');
const { convert, ext, resolveFormat } = require('../tools/formatConverter');

const TEMPLATES_FILE = path.join(__dirname, '../data/templates.json');
const DEFAULT_FORMAT = { testStrategy: 'markdown', testPlan: 'markdown', testCases: 'csv', bugReport: 'markdown' };

function getTemplate(templateId, artifactType) {
  const fallback = { systemPrompt: undefined, outputFormat: DEFAULT_FORMAT[artifactType] || 'markdown' };
  if (!templateId) return fallback;
  try {
    const all = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8').replace(/^﻿/, ''));
    const t = all.find(t => t.id === templateId);
    return { systemPrompt: t?.systemPrompt, outputFormat: t?.outputFormat || fallback.outputFormat };
  } catch { return fallback; }
}

router.post('/generate', async (req, res) => {
  const { context, artifacts: sel, templateIds = {}, llmConfig } = req.body;
  if (!context) return res.status(400).json({ error: 'context required' });
  const llmOpts = llmConfig ? { provider: llmConfig.provider, apiKey: llmConfig.apiKey, model: llmConfig.model } : {};
  const results = {}, errors = {};
  const run = async (key, fn) => { if (!sel[key]) return; try { results[key] = await fn(); } catch (err) { errors[key] = err.message; } };

  // Strip screenshot from text-tool context — base64 blows token limits on text models
  const { screenshotB64, ...textContext } = context;

  await Promise.all([
    run('testStrategy', async () => {
      const { systemPrompt: sys, outputFormat: rawFmt } = getTemplate(templateIds.testStrategy, 'testStrategy');
      const outputFormat = resolveFormat(rawFmt);
      const json = await generateTestStrategy(textContext, sys, llmOpts);
      const content = outputFormat === 'json' ? JSON.stringify(json, null, 2) : convert(renderStrategy(json), 'markdown', outputFormat, json.title);
      return { json, content, format: outputFormat, rawFormat: rawFmt, ext: ext(rawFmt) };
    }),
    run('testPlan', async () => {
      const { systemPrompt: sys, outputFormat: rawFmt } = getTemplate(templateIds.testPlan, 'testPlan');
      const outputFormat = resolveFormat(rawFmt);
      const json = await generateTestPlan(textContext, sys, llmOpts);
      const content = outputFormat === 'json' ? JSON.stringify(json, null, 2) : convert(renderPlan(json), 'markdown', outputFormat, json.title);
      return { json, content, format: outputFormat, rawFormat: rawFmt, ext: ext(rawFmt) };
    }),
    run('testCases', async () => {
      const { systemPrompt: sys, outputFormat: rawFmt } = getTemplate(templateIds.testCases, 'testCases');
      const outputFormat = resolveFormat(rawFmt);
      const json = await generateTestCases(textContext, sys, llmOpts);
      const content = outputFormat === 'json' ? JSON.stringify(json, null, 2) : convert(toCSV(json), 'csv', outputFormat, 'Test Cases');
      return { json, content, format: outputFormat, rawFormat: rawFmt, ext: ext(rawFmt) };
    }),
    run('bugReport', async () => {
      if (!screenshotB64) throw new Error('No screenshot provided for Bug Report');
      const { systemPrompt: sys, outputFormat: rawFmt } = getTemplate(templateIds.bugReport, 'bugReport');
      const outputFormat = resolveFormat(rawFmt);
      const json = await generateBugReport(screenshotB64, textContext, sys, llmOpts);
      const content = outputFormat === 'json' ? JSON.stringify(json, null, 2) : convert(renderBugs(json), 'markdown', outputFormat, 'Bug Report');
      return { json, content, format: outputFormat, rawFormat: rawFmt, ext: ext(rawFmt) };
    })
  ]);
  res.json({ results, errors });
});

module.exports = router;
