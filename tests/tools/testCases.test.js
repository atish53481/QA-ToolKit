// tests/tools/testCases.test.js
jest.mock('../../tools/llmClient');
const { chat } = require('../../tools/llmClient');
const { generateTestCases, toCSV } = require('../../tools/testCases');

const MOCK = { testCases: [{ scenario: 'Login', tid: 'TC-001', testData: 'valid creds', testCaseDescription: 'Verify login', preCondition: 'Account exists', testSteps: '1. Open\n2. Enter\n3. Submit', expectedResult: 'Dashboard shown', priority: 'High', isAutomated: 'No', misc: '' }] };

describe('generateTestCases', () => {
  it('returns normalized test case array', async () => {
    chat.mockResolvedValue(MOCK);
    const cases = await generateTestCases({ source: 'jira', jiraIssue: { summary: 'Login' } });
    expect(cases[0].tid).toBe('TC-001');
    expect(cases[0].status).toBe('Not Executed');
    expect(cases[0].actualResult).toBe('');
  });

  it('auto-generates TIDs when omitted', async () => {
    chat.mockResolvedValue({ testCases: [{ scenario: 'Test', expectedResult: 'result' }] });
    const cases = await generateTestCases({ source: 'file', fileText: 'x' });
    expect(cases[0].tid).toBe('TC-001');
  });
});

describe('toCSV', () => {
  it('produces 13-column CSV with correct headers', async () => {
    chat.mockResolvedValue(MOCK);
    const cases = await generateTestCases({ source: 'file', fileText: 'x' });
    const csv = toCSV(cases);
    expect(csv.split('\n')[0]).toContain('Scenario');
    expect(csv.split('\n')[0]).toContain('Is Automated');
  });
});
