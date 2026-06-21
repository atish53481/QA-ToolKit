// tests/tools/llmClient.test.js
jest.mock('axios');
const axios = require('axios');
const { chat, PROVIDERS } = require('../../tools/llmClient');

describe('chat', () => {
  it('calls GROQ endpoint and returns parsed JSON', async () => {
    axios.post = jest.fn().mockResolvedValue({ data: { choices: [{ message: { content: '{"result":"ok"}' } }] } });
    process.env.LLM_PROVIDER = 'groq';
    process.env.LLM_API_KEY = 'test-key';
    process.env.LLM_MODEL = 'openai/gpt-oss-120b';
    const result = await chat([{ role: 'user', content: 'test' }]);
    expect(result).toEqual({ result: 'ok' });
    expect(axios.post).toHaveBeenCalledWith(PROVIDERS.groq.url, expect.objectContaining({ temperature: 0.3 }), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) }));
  });

  it('throws LLM error on non-2xx', async () => {
    axios.post = jest.fn().mockRejectedValue({ response: { status: 429, data: { error: { message: 'Rate limit' } } } });
    await expect(chat([{ role: 'user', content: 'x' }])).rejects.toThrow('LLM 429');
  });

  it('throws on invalid JSON response', async () => {
    axios.post = jest.fn().mockResolvedValue({ data: { choices: [{ message: { content: 'not json' } }] } });
    await expect(chat([{ role: 'user', content: 'x' }])).rejects.toThrow('did not return valid JSON');
  });
});
