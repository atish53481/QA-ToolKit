import { useState } from 'react';
const col = (active) => ({ flex: 1, border: ('2px solid ' + (active ? '#3b82f6' : '#e5e7eb')), borderRadius: 8, padding: 16, minWidth: 0 });
const inp = { width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, marginTop: 4, boxSizing: 'border-box' };
const btn = (d) => ({ padding: '7px 14px', background: d ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: d ? 'not-allowed' : 'pointer', fontSize: 13, marginTop: 8 });

export default function JiraInput({ isJiraConfigured, onIssueChange }) {
  const [projectId, setProjectId] = useState('');
  const [issueId, setIssueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true); setError(''); setIssue(null);
    try {
      const r = await fetch('/api/jira/fetch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jiraId: issueId }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setIssue(data.issue); onIssueChange(data.issue, projectId);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={col(!!issue)}>
      <strong style={{ fontSize: 14 }}>Jira Issue ID</strong>
      {!isJiraConfigured && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Configure Jira in Config tab first</div>}
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Project ID</div>
      <input value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="VWO" style={inp} disabled={!isJiraConfigured} />
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Issue ID</div>
      <input value={issueId} onChange={e => setIssueId(e.target.value)} placeholder="VWO-48" style={inp} disabled={!isJiraConfigured} />
      <button onClick={handleFetch} disabled={!issueId || !isJiraConfigured || loading} style={btn(!issueId || !isJiraConfigured || loading)}>{loading ? 'Fetching...' : 'Fetch'}</button>
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
      {issue && <div style={{ marginTop: 10, padding: 10, background: '#f0fdf4', borderRadius: 4, fontSize: 12 }}><div style={{ fontWeight: 600 }}>{issue.id}: {issue.summary}</div><div style={{ color: '#6b7280', marginTop: 4 }}>Priority: {issue.priority} | Status: {issue.status}</div></div>}
    </div>
  );
}
