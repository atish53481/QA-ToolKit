import { useState } from 'react';
import { apiFetch } from '../api';
const S = { card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }, label: { display: 'block', fontSize: 13, color: '#374151', marginBottom: 4, marginTop: 12 }, input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' } };
const btn = (d) => ({ padding: '8px 16px', background: d ? '#9ca3af' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 4, cursor: d ? 'not-allowed' : 'pointer', fontSize: 14 });

export default function JiraCard({ configStatus, onStatusChange }) {
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const complete = jiraUrl && jiraEmail && jiraToken;

  const handleVerify = async () => {
    setVerifying(true); setResult(null);
    try {
      const r = await apiFetch('/api/config/verify-jira', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jiraUrl, jiraEmail, jiraToken }) });
      const data = await r.json(); setResult(data);
      if (data.ok) {
        await apiFetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jiraUrl, jiraEmail, jiraToken }) });
        onStatusChange(prev => ({ ...prev, jira: { configured: true, url: jiraUrl } }));
      }
    } finally { setVerifying(false); }
  };

  return (
    <div style={{ ...S.card, opacity: complete ? 1 : 0.75 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Jira Configuration <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 13 }}>(optional)</span></strong>
        {configStatus?.configured && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>}
      </div>
      <label style={S.label}>Base URL</label>
      <input value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="https://your-domain.atlassian.net" style={S.input} />
      <label style={S.label}>Email</label>
      <input value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} placeholder="you@company.com" style={S.input} />
      <label style={S.label}>API Token</label>
      <input type="password" value={jiraToken} onChange={e => setJiraToken(e.target.value)} placeholder="Atlassian API token" style={S.input} />
      <div style={{ marginTop: 16 }}>
        <button onClick={handleVerify} disabled={!complete || verifying} style={btn(!complete || verifying)}>
          {verifying ? 'Verifying...' : 'Verify and Save'}
        </button>
      </div>
      {result && <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 4, fontSize: 13, background: result.ok ? '#dbeafe' : '#fee2e2', color: result.ok ? '#1e40af' : '#991b1b' }}>{result.ok ? ('Connected as ' + result.displayName) : result.message}</div>}
    </div>
  );
}
