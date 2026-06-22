const express = require('express');
const router = express.Router();
const { generateTestStrategy, renderMarkdown: renderStrategy } = require('../tools/testStrategy');
const { generateTestPlan, renderMarkdown: renderPlan } = require('../tools/testPlan');
const { generateTestCases, toCSV } = require('../tools/testCases');
const { generateBugReport, renderMarkdown: renderBugs } = require('../tools/bugReport');

router.post('/generate', async (req, res) => {
  const { context, artifacts: sel } = req.body;
  if (!context) return res.status(400).json({ error: 'context required' });
  const results = {}, errors = {};
  const run = async (key, fn) => { if (!sel[key]) return; try { results[key] = await fn(); } catch (err) { errors[key] = err.message; } };
  await Promise.all([
    run('testStrategy', async () => { const json = await generateTestStrategy(context); return { json, markdown: renderStrategy(json) }; }),
    run('testPlan', async () => { const json = await generateTestPlan(context); return { json, markdown: renderPlan(json) }; }),
    run('testCases', async () => { const json = await generateTestCases(context); return { json, csv: toCSV(json) }; }),
    run('bugReport', async () => {
      if (!context.screenshotB64) throw new Error('No screenshot provided for Bug Report');
      const json = await generateBugReport(context.screenshotB64, context);
      return { json, markdown: renderBugs(json) };
    })
  ]);
  res.json({ results, errors });
});

module.exports = router;
