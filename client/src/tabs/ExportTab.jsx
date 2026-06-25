import { useState } from 'react';
import { apiFetch } from '../api';

export default function ExportTab({ artifacts, configStatus, context }) {
  const [downloading, setDownloading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [jiraId, setJiraId] = useState(context?.jiraIssue?.id || '');
  const hasArtifacts = artifacts && Object.keys(artifacts).length > 0;
  const isJiraConfigured = configStatus?.jira?.configured;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const r = await apiFetch('/api/export/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artifacts }) });
      if (!r.ok) throw new Error('Download failed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'qa-artifacts.zip'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert(err.message); }
    finally { setDownloading(false); }
  };

  const handlePublish = async () => {
    if (!jiraId) return alert('Enter a Jira Issue ID');
    setPublishing(true); setPublishResult(null);
    try {
      const r = await apiFetch('/api/jira/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jiraId, artifacts }) });
      setPublishResult(await r.json());
    } catch (err) { setPublishResult({ ok: false, error: err.message }); }
    finally { setPublishing(false); }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      {!hasArtifacts && <div style={{ padding: 16, background: '#fef3c7', borderRadius: 6, color: '#92400e', marginBottom: 20 }}>No artifacts yet — go to Generate tab first.</div>}
      {hasArtifacts && (
        <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 6, marginBottom: 20 }}>
          <strong style={{ fontSize: 14, color: '#166534' }}>Ready to export:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13, color: '#15803d' }}>
            {artifacts.testStrategy && <li>Test Strategy</li>}
            {artifacts.testPlan && <li>Test Plan</li>}
            {artifacts.testCases && <li>Test Cases (CSV)</li>}
            {artifacts.bugReport && <li>Bug Report</li>}
          </ul>
        </div>
      )}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <strong>Download ZIP</strong>
        <div style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 14px' }}>Test Strategy.md - Test Plan.md - Test Cases.csv - Bug Report.md</div>
        <button onClick={handleDownload} disabled={!hasArtifacts || downloading} style={{ padding: '9px 20px', background: !hasArtifacts || downloading ? '#9ca3af' : '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>
          {downloading ? 'Preparing...' : 'Download ZIP'}
        </button>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, opacity: isJiraConfigured ? 1 : 0.5 }}>
        <strong>Publish to Jira</strong>
        {!isJiraConfigured && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Configure Jira in Config tab to enable</div>}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 4 }}>Post under Jira Issue ID</label>
          <input value={jiraId} onChange={e => setJiraId(e.target.value)} placeholder="VWO-48" disabled={!isJiraConfigured} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }} />
          <button onClick={handlePublish} disabled={!hasArtifacts || !isJiraConfigured || publishing} style={{ padding: '9px 20px', background: !hasArtifacts || !isJiraConfigured || publishing ? '#9ca3af' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>
            {publishing ? 'Publishing...' : 'Publish to Jira'}
          </button>
        </div>
        {publishResult && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 4, fontSize: 13, background: publishResult.ok ? '#dbeafe' : '#fee2e2', color: publishResult.ok ? '#1e40af' : '#991b1b' }}>{publishResult.ok ? ('Connected: ' + publishResult.message) : ('Error: ' + publishResult.error)}</div>}
      </div>
    </div>
  );
}
