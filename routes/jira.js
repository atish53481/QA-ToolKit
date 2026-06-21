const express = require('express');
const router = express.Router();
const axios = require('axios');
const { fetchIssue } = require('../tools/jiraClient');

router.post('/fetch', async (req, res) => {
  const { jiraId } = req.body;
  const config = { jiraUrl: process.env.JIRA_URL, jiraEmail: process.env.JIRA_EMAIL, jiraToken: process.env.JIRA_TOKEN };
  if (!config.jiraUrl || !config.jiraToken) return res.status(400).json({ error: 'Jira not configured' });
  try {
    const issue = await fetchIssue(config, jiraId);
    res.json({ issue });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/publish', async (req, res) => {
  const { jiraId, artifacts } = req.body;
  const { JIRA_URL, JIRA_EMAIL, JIRA_TOKEN } = process.env;
  if (!JIRA_URL || !JIRA_TOKEN) return res.status(400).json({ error: 'Jira not configured' });
  const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  const base = JIRA_URL.replace(/\/+$/, '');
  const headers = { Authorization: `Basic ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };
  const body = [
    artifacts.testStrategy?.markdown && `**Test Strategy**\n\n${artifacts.testStrategy.markdown}`,
    artifacts.testPlan?.markdown && `**Test Plan**\n\n${artifacts.testPlan.markdown}`,
    artifacts.testCases?.csv && `**Test Cases (CSV)**\n\n${artifacts.testCases.csv}`,
    artifacts.bugReport?.markdown && `**Bug Report**\n\n${artifacts.bugReport.markdown}`
  ].filter(Boolean).join('\n\n---\n\n');
  if (!body) return res.status(400).json({ error: 'No artifacts to publish' });
  try {
    await axios.post(`${base}/rest/api/3/issue/${jiraId}/comment`, {
      body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] }
    }, { headers });
    res.json({ ok: true, message: `Published to ${jiraId}` });
  } catch (err) {
    res.status(502).json({ error: `Jira ${err.response?.status || 'ERR'}: publish failed` });
  }
});

module.exports = router;
