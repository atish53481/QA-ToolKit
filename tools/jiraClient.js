const axios = require('axios');

function flattenAdf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  const BLOCK = ['paragraph','heading','listItem','blockquote','rule','hardBreak','bulletList','orderedList'];
  const children = (node.content || []).map(flattenAdf).join('');
  return BLOCK.includes(node.type) ? children + '\n' : children;
}

function normalizeIssue(raw) {
  const f = raw.fields || {};
  const desc = f.description;
  return {
    id: raw.key,
    summary: f.summary || '',
    description: desc && typeof desc === 'object' ? flattenAdf(desc) : (desc || ''),
    priority: f.priority?.name || 'Medium',
    assignee: f.assignee?.displayName || '',
    components: (f.components || []).map(c => c.name),
    status: f.status?.name || ''
  };
}

async function fetchIssue(config, jiraId) {
  const base = (config.jiraUrl || '').replace(/\/+$/, '');
  const token = Buffer.from(`${config.jiraEmail}:${config.jiraToken}`).toString('base64');
  try {
    const { data } = await axios.get(`${base}/rest/api/3/issue/${jiraId}`, {
      headers: { Authorization: `Basic ${token}`, Accept: 'application/json' },
      params: { fields: 'summary,description,priority,assignee,components,status' }
    });
    return normalizeIssue(data);
  } catch (err) {
    const status = err.response?.status || 'ERR';
    const body = JSON.stringify(err.response?.data || err.message).slice(0, 200);
    throw new Error(`Jira ${status} fetching ${jiraId}: ${body}`);
  }
}

module.exports = { fetchIssue, normalizeIssue, flattenAdf };
