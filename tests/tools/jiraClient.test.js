// tests/tools/jiraClient.test.js
jest.mock('axios');
const axios = require('axios');
const { fetchIssue, normalizeIssue, flattenAdf } = require('../../tools/jiraClient');

describe('flattenAdf', () => {
  it('extracts text from paragraph node', () => {
    const adf = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] };
    expect(flattenAdf(adf)).toBe('Hello\n');
  });
  it('returns empty string for null', () => {
    expect(flattenAdf(null)).toBe('');
  });
});

describe('normalizeIssue', () => {
  it('maps raw Jira fields to flat object', () => {
    const raw = { key: 'VWO-48', fields: { summary: 'Login', description: null, priority: { name: 'High' }, assignee: null, components: [], status: { name: 'To Do' } } };
    const r = normalizeIssue(raw);
    expect(r.id).toBe('VWO-48');
    expect(r.priority).toBe('High');
    expect(r.description).toBe('');
  });
});

describe('fetchIssue', () => {
  it('calls Jira REST with Basic auth and returns normalized issue', async () => {
    axios.get = jest.fn().mockResolvedValue({ data: { key: 'VWO-48', fields: { summary: 'Login', description: null, priority: { name: 'High' }, assignee: null, components: [], status: { name: 'To Do' } } } });
    const result = await fetchIssue({ jiraUrl: 'https://x.atlassian.net', jiraEmail: 'a@b.com', jiraToken: 'tok' }, 'VWO-48');
    expect(result.id).toBe('VWO-48');
    expect(axios.get).toHaveBeenCalledWith('https://x.atlassian.net/rest/api/3/issue/VWO-48', expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Basic /) }) }));
  });

  it('throws with status on non-2xx', async () => {
    axios.get = jest.fn().mockRejectedValue({ response: { status: 401, data: 'Unauthorized' } });
    await expect(fetchIssue({ jiraUrl: 'https://x.atlassian.net', jiraEmail: 'a@b.com', jiraToken: 'bad' }, 'X-1')).rejects.toThrow('Jira 401');
  });
});
