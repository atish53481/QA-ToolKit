// tests/tools/testStrategy.test.js
jest.mock('../../tools/llmClient');
const { chat } = require('../../tools/llmClient');
const { generateTestStrategy, renderMarkdown } = require('../../tools/testStrategy');

const MOCK = { title: 'Login Strategy', overview: 'Covers login', testObjectives: ['Verify login'], testScope: { inScope: ['Login page'], outOfScope: ['Registration'] }, testTypes: ['Functional'], testLevels: ['Integration'], testTools: ['Jest'], testEnvironment: 'Staging', defectManagement: 'Jira', riskAnalysis: [{ risk: 'Flaky', impact: 'Low', mitigation: 'Retry' }], metricsAndReporting: ['Pass rate'] };

describe('generateTestStrategy', () => {
  it('returns normalized strategy from LLM', async () => {
    chat.mockResolvedValue(MOCK);
    const result = await generateTestStrategy({ source: 'jira', jiraIssue: { summary: 'Login' } });
    expect(result.title).toBe('Login Strategy');
    expect(Array.isArray(result.riskAnalysis)).toBe(true);
  });

  it('applies defaults on empty LLM response', async () => {
    chat.mockResolvedValue({});
    const result = await generateTestStrategy({ source: 'file', fileText: 'x' });
    expect(result.title).toBe('TBD');
    expect(result.testObjectives).toEqual([]);
  });
});

describe('renderMarkdown', () => {
  it('contains all section headers', () => {
    const md = renderMarkdown(MOCK);
    expect(md).toContain('## Overview');
    expect(md).toContain('## Risk Analysis');
  });
});
