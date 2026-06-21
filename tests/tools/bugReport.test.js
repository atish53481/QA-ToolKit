// tests/tools/bugReport.test.js
jest.mock('../../tools/llmClient');
const { chat } = require('../../tools/llmClient');
const { generateBugReport, renderMarkdown } = require('../../tools/bugReport');

const MOCK = { bugs: [{ bugId: 'BUG-001', title: 'Button disabled', description: 'Login button greyed out', severity: 'High', priority: 'High', stepsToReproduce: ['Open app','Enter creds','Observe'], expectedBehavior: 'Button enabled', actualBehavior: 'Button disabled', environment: 'Chrome / Windows 11' }] };

describe('generateBugReport', () => {
  it('returns normalized bug array', async () => {
    chat.mockResolvedValue(MOCK);
    process.env.LLM_PROVIDER = 'groq';
    const bugs = await generateBugReport('data:image/png;base64,abc', { projectId: 'VWO' });
    expect(bugs[0].bugId).toBe('BUG-001');
    expect(Array.isArray(bugs[0].stepsToReproduce)).toBe(true);
  });

  it('returns empty array when LLM finds no bugs', async () => {
    chat.mockResolvedValue({ bugs: [] });
    const bugs = await generateBugReport('data:image/png;base64,abc', {});
    expect(bugs).toEqual([]);
  });
});

describe('renderMarkdown', () => {
  it('renders no-bugs message for empty array', () => {
    expect(renderMarkdown([])).toContain('No bugs identified');
  });

  it('renders bug details', async () => {
    chat.mockResolvedValue(MOCK);
    const bugs = await generateBugReport('data:image/png;base64,abc', {});
    const md = renderMarkdown(bugs);
    expect(md).toContain('BUG-001');
    expect(md).toContain('Steps to Reproduce');
  });
});
