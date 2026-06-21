const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ENV_PATH = path.join(__dirname, '..', '.env');

const PROVIDER_URLS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages'
};

const DEFAULT_MODELS = {
  groq: 'openai/gpt-oss-120b',
  openai: 'gpt-4o',
  claude: 'claude-opus-4-7'
};

function updateEnv(updates) {
  let content = '';
  try { content = fs.readFileSync(ENV_PATH, 'utf8'); } catch {}
  const map = {};
  content.split('\n').filter(Boolean).forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0) map[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  Object.assign(map, updates);
  Object.assign(process.env, updates);
  fs.writeFileSync(ENV_PATH, Object.entries(map).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
}

router.get('/status', (_, res) => {
  res.json({
    llm: { configured: !!process.env.LLM_API_KEY, provider: process.env.LLM_PROVIDER || null, model: process.env.LLM_MODEL || null },
    jira: { configured: !!(process.env.JIRA_URL && process.env.JIRA_TOKEN), url: process.env.JIRA_URL || null }
  });
});

router.post('/', (req, res) => {
  const { llmProvider, llmApiKey, llmModel, jiraUrl, jiraEmail, jiraToken } = req.body;
  const updates = {};
  if (llmProvider) updates.LLM_PROVIDER = llmProvider;
  if (llmApiKey) updates.LLM_API_KEY = llmApiKey;
  if (llmModel) updates.LLM_MODEL = llmModel;
  if (jiraUrl) updates.JIRA_URL = jiraUrl;
  if (jiraEmail) updates.JIRA_EMAIL = jiraEmail;
  if (jiraToken) updates.JIRA_TOKEN = jiraToken;
  updateEnv(updates);
  res.json({ ok: true });
});

router.post('/test-llm', async (req, res) => {
  const { provider, apiKey, model } = req.body;
  if (!PROVIDER_URLS[provider]) return res.status(400).json({ ok: false, message: `Unknown provider: ${provider}` });
  const m = model || DEFAULT_MODELS[provider];
  try {
    if (provider === 'claude') {
      await axios.post(PROVIDER_URLS.claude, { model: m, system: 'ping', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
        { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } });
    } else {
      await axios.post(PROVIDER_URLS[provider], { model: m, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
    }
    res.json({ ok: true, message: 'Connected' });
  } catch (err) {
    res.json({ ok: false, message: `${err.response?.status || 'ERR'}: ${err.response?.data?.error?.message || err.message}` });
  }
});

router.post('/verify-jira', async (req, res) => {
  const { jiraUrl, jiraEmail, jiraToken } = req.body;
  const base = (jiraUrl || '').replace(/\/+$/, '');
  const token = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
  try {
    const { data } = await axios.get(`${base}/rest/api/3/myself`,
      { headers: { Authorization: `Basic ${token}`, Accept: 'application/json' } });
    res.json({ ok: true, displayName: data.displayName });
  } catch (err) {
    res.json({ ok: false, message: `Jira ${err.response?.status || 'ERR'}: Cannot connect` });
  }
});

module.exports = router;
