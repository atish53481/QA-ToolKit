import { useState } from 'react';

const PROVIDERS = { groq: { label: 'GROQ (Free)', defaultModel: 'openai/gpt-oss-120b' }, claude: { label: 'Claude (Anthropic)', defaultModel: 'claude-opus-4-7' }, openai: { label: 'OpenAI', defaultModel: 'gpt-4o' } };
const S = { card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 }, label: { display: 'block', fontSize: 13, color: '#374151', marginBottom: 4, marginTop: 12 }, input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' } };
const btn = (d) => ({ padding: '8px 16px', background: d ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: d ? 'not-allowed' : 'pointer', fontSize: 14 });

export default function LLMCard({ configStatus, onStatusChange }) {
  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDERS.groq.defaultModel);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const changeProvider = (p) => { setProvider(p); setModel(PROVIDERS[p].defaultModel); };

  const handleSave = async () => {
    setSaving(true); setResult(null);
    try {
      const r = await fetch('/api/config/test-llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, apiKey, model }) });
      const data = await r.json(); setResult(data);
      if (data.ok) {
        await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ llmProvider: provider, llmApiKey: apiKey, llmModel: model }) });
        onStatusChange(prev => ({ ...prev, llm: { configured: true, provider, model } }));
      }
    } finally { setSaving(false); }
  };

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>LLM Configuration</strong>
        {configStatus?.configured && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>}
      </div>
      <label style={S.label}>Provider</label>
      <select value={provider} onChange={e => changeProvider(e.target.value)} style={S.input}>
        {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <label style={S.label}>API Key</label>
      <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste API key..." style={S.input} />
      <label style={S.label}>Model</label>
      <input value={model} onChange={e => setModel(e.target.value)} style={S.input} />
      <div style={{ marginTop: 16 }}>
        <button onClick={handleSave} disabled={!apiKey || saving} style={btn(!apiKey || saving)}>
          {saving ? 'Testing...' : 'Test and Save'}
        </button>
      </div>
      {result && <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 4, fontSize: 13, background: result.ok ? '#dcfce7' : '#fee2e2', color: result.ok ? '#166534' : '#991b1b' }}>{result.ok ? 'Connected and saved' : result.message}</div>}
    </div>
  );
}
