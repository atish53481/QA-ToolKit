const axios = require('axios');

const PROVIDERS = {
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'openai/gpt-oss-120b', visionModel: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o', visionModel: 'gpt-4o' },
  claude: { url: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-opus-4-7', visionModel: 'claude-opus-4-7' }
};

async function chat(messages, opts = {}) {
  const provider = opts.provider || process.env.LLM_PROVIDER || 'groq';
  const apiKey = opts.apiKey || process.env.LLM_API_KEY;
  const model = opts.model || process.env.LLM_MODEL || PROVIDERS[provider]?.defaultModel;
  if (!PROVIDERS[provider]) throw new Error(`Unknown LLM provider: ${provider}`);
  if (provider === 'claude') return _chatClaude(messages, { apiKey, model });
  return _chatOpenAICompat(messages, { provider, apiKey, model });
}

async function _chatOpenAICompat(messages, { provider, apiKey, model }) {
  const isVision = messages.some(m => Array.isArray(m.content));
  const resolvedModel = isVision ? (PROVIDERS[provider].visionModel || model) : model;
  const body = { model: resolvedModel, messages, temperature: 0.3 };
  if (!isVision) body.response_format = { type: 'json_object' };
  try {
    const { data } = await axios.post(PROVIDERS[provider].url, body,
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
    const raw = data.choices[0].message.content;
    const content = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try { return JSON.parse(content); } catch { throw new Error(`LLM did not return valid JSON: ${content.slice(0, 100)}`); }
  } catch (err) {
    if (err.message?.includes('valid JSON')) throw err;
    throw new Error(`LLM ${err.response?.status || 'ERR'}: ${err.response?.data?.error?.message || err.message}`);
  }
}

async function _chatClaude(messages, { apiKey, model }) {
  const system = messages.find(m => m.role === 'system')?.content || '';
  const userMsgs = messages.filter(m => m.role !== 'system');
  try {
    const { data } = await axios.post(PROVIDERS.claude.url,
      { model, system, messages: userMsgs, max_tokens: 4096, temperature: 0.3 },
      { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } });
    const raw = data.content[0].text;
    const content = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try { return JSON.parse(content); } catch { throw new Error(`LLM did not return valid JSON: ${content.slice(0, 100)}`); }
  } catch (err) {
    if (err.message?.includes('valid JSON')) throw err;
    throw new Error(`LLM ${err.response?.status || 'ERR'}: ${err.response?.data?.error?.message || err.message}`);
  }
}

module.exports = { chat, PROVIDERS };
