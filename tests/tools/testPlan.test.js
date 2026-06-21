// tests/tools/testPlan.test.js
jest.mock('../../tools/llmClient');
const { chat } = require('../../tools/llmClient');
const { generateTestPlan, renderMarkdown } = require('../../tools/testPlan');

const MOCK = { objective: 'Verify login', scope: { inScope: ['Login'], outOfScope: ['API'] }, inclusions: ['Positive tests'], testEnvironments: ['Staging'], defectReporting: 'Jira', testStrategy: ['Functional'], schedule: [{ phase: 'Design', owner: 'QA', dates: 'TBD' }], deliverables: ['Test cases'], entryCriteria: ['Build deployed'], exitCriteria: ['95% pass'], tools: ['Jest'], risksAndMitigations: [{ risk: 'Late build', mitigation: 'Buffer' }], approvals: [{ role: 'QA Lead', name: 'TBD' }] };

describe('generateTestPlan', () => {
  it('returns all 13 keys from LLM response', async () => {
    chat.mockResolvedValue(MOCK);
    const r = await generateTestPlan({ source: 'jira', jiraIssue: { summary: 'Login' } });
    expect(r.objective).toBe('Verify login');
    expect(Array.isArray(r.schedule)).toBe(true);
    expect(Array.isArray(r.approvals)).toBe(true);
  });

  it('applies safe defaults on empty response', async () => {
    chat.mockResolvedValue({});
    const r = await generateTestPlan({ source: 'file', fileText: 'x' });
    expect(r.objective).toBe('TBD');
    expect(r.schedule).toEqual([]);
  });
});

describe('renderMarkdown', () => {
  it('contains all 13 numbered section headers', () => {
    const md = renderMarkdown(MOCK);
    for (let i = 1; i <= 13; i++) expect(md).toContain(`## ${i}.`);
  });
});
