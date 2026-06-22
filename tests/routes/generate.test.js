// tests/routes/generate.test.js
jest.mock('../../tools/testStrategy');
jest.mock('../../tools/testPlan');
jest.mock('../../tools/testCases');
jest.mock('../../tools/bugReport');

const { generateTestStrategy, renderMarkdown: renderStrategy } = require('../../tools/testStrategy');
const { generateTestPlan, renderMarkdown: renderPlan } = require('../../tools/testPlan');
const { generateTestCases, toCSV } = require('../../tools/testCases');
const request = require('supertest');
const app = require('../../server');

describe('POST /api/llm/generate', () => {
  beforeEach(() => {
    generateTestStrategy.mockResolvedValue({ title: 'S' });
    renderStrategy.mockReturnValue('# Strategy');
    generateTestPlan.mockResolvedValue({ objective: 'P' });
    renderPlan.mockReturnValue('# Plan');
    generateTestCases.mockResolvedValue([{ tid: 'TC-001' }]);
    toCSV.mockReturnValue('Scenario,TID\n"Login","TC-001"');
  });

  it('returns results for selected artifacts only', async () => {
    const res = await request(app).post('/api/llm/generate').send({ context: { source: 'file', fileText: 'Login' }, artifacts: { testStrategy: true, testPlan: true, testCases: false, bugReport: false } });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveProperty('testStrategy');
    expect(res.body.results).toHaveProperty('testPlan');
    expect(res.body.results).not.toHaveProperty('testCases');
  });

  it('captures per-artifact errors without failing entire request', async () => {
    generateTestPlan.mockRejectedValue(new Error('LLM 429: Rate limit'));
    const res = await request(app).post('/api/llm/generate').send({ context: { source: 'file', fileText: 'x' }, artifacts: { testStrategy: true, testPlan: true, testCases: false, bugReport: false } });
    expect(res.status).toBe(200);
    expect(res.body.errors).toHaveProperty('testPlan');
    expect(res.body.results).toHaveProperty('testStrategy');
  });
});
