// tests/routes/config.test.js
const request = require('supertest');
const app = require('../../server');

describe('GET /api/config/status', () => {
  it('returns llm and jira status objects', async () => {
    const res = await request(app).get('/api/config/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('llm');
    expect(res.body).toHaveProperty('jira');
    expect(typeof res.body.llm.configured).toBe('boolean');
  });
});

describe('POST /api/config/test-llm', () => {
  it('returns 400 for unknown provider', async () => {
    const res = await request(app)
      .post('/api/config/test-llm')
      .send({ provider: 'bogus', apiKey: 'x', model: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
