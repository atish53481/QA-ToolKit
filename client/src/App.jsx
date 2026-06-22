import { useState, useEffect } from 'react';
import ConfigTab from './tabs/ConfigTab';
import InputTab from './tabs/InputTab';
import GenerateTab from './tabs/GenerateTab';
import ExportTab from './tabs/ExportTab';

const TABS = ['Config', 'Input', 'Generate', 'Export'];
const tabStyle = (active) => ({ padding: '10px 20px', background: 'none', border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', color: active ? '#3b82f6' : '#6b7280', fontWeight: active ? 700 : 400, cursor: 'pointer', marginBottom: -2, fontSize: 14 });

export default function App() {
  const [tab, setTab] = useState('Config');
  const [configStatus, setConfigStatus] = useState({ llm: { configured: false }, jira: { configured: false } });
  const [context, setContext] = useState({ source: 'file', jiraIssue: null, fileText: '', screenshotB64: '', projectId: '' });
  const [artifacts, setArtifacts] = useState(null);

  useEffect(() => { fetch('/api/config/status').then(r => r.json()).then(setConfigStatus).catch(() => {}); }, []);

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>QA Generator</div>
      <nav style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
        {TABS.map(t => <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>{t}</button>)}
      </nav>
      {tab === 'Config' && <ConfigTab configStatus={configStatus} onStatusChange={setConfigStatus} />}
      {tab === 'Input' && <InputTab configStatus={configStatus} context={context} onContextChange={setContext} />}
      {tab === 'Generate' && <GenerateTab context={context} onArtifacts={setArtifacts} />}
      {tab === 'Export' && <ExportTab artifacts={artifacts} configStatus={configStatus} context={context} />}
    </div>
  );
}
