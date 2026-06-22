import { useState } from 'react';
import Markdown from 'react-markdown';

const KEYS = ['testStrategy', 'testPlan', 'testCases', 'bugReport'];
const LABELS = { testStrategy: 'Test Strategy', testPlan: 'Test Plan', testCases: 'Test Cases', bugReport: 'Bug Report' };

export default function GenerateTab({ context, onArtifacts }) {
  const hasScreenshot = !!context.screenshotB64;
  const hasInput = context.jiraIssue || context.fileText || context.screenshotB64;
  const [selected, setSelected] = useState({ testStrategy: true, testPlan: true, testCases: true, bugReport: false });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [activePreview, setActivePreview] = useState('testStrategy');

  const toggle = (k) => { if (k === 'bugReport' && !hasScreenshot) return; setSelected(p => ({ ...p, [k]: !p[k] })); };

  const handleGenerate = async () => {
    setGenerating(true); setResults(null); setErrors({});
    try {
      const r = await fetch('/api/llm/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, artifacts: selected }) });
      const data = await r.json();
      setResults(data.results); setErrors(data.errors || {});
      onArtifacts(data.results);
      const first = KEYS.find(k => data.results[k]); if (first) setActivePreview(first);
    } catch (err) { setErrors({ general: err.message }); }
    finally { setGenerating(false); }
  };

  return (
    <div>
      {!hasInput && <div style={{ padding: 16, background: '#fef3c7', borderRadius: 6, color: '#92400e', marginBottom: 16 }}>No input — go to Input tab first.</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {KEYS.map(k => (
          <div key={k} onClick={() => toggle(k)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 6, cursor: k === 'bugReport' && !hasScreenshot ? 'not-allowed' : 'pointer', opacity: k === 'bugReport' && !hasScreenshot ? 0.4 : 1, background: selected[k] ? '#eff6ff' : 'transparent', border: '1px solid #e5e7eb' }}>
            <input type="checkbox" checked={selected[k]} readOnly style={{ accentColor: '#3b82f6' }} />
            <span style={{ fontSize: 14 }}>{LABELS[k]}</span>
            {k === 'bugReport' && !hasScreenshot && <span style={{ fontSize: 11, color: '#9ca3af' }}>(needs screenshot)</span>}
            {results?.[k] && <span style={{ fontSize: 11, color: '#16a34a' }}>done</span>}
            {errors[k] && <span style={{ fontSize: 11, color: '#dc2626' }}>error</span>}
          </div>
        ))}
      </div>
      <button onClick={handleGenerate} disabled={generating || !hasInput} style={{ padding: '10px 24px', background: generating || !hasInput ? '#9ca3af' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
        {generating ? 'Generating...' : 'Generate'}
      </button>
      {errors.general && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{errors.general}</div>}
      {results && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb' }}>
            {KEYS.filter(k => results[k]).map(k => (
              <button key={k} onClick={() => setActivePreview(k)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activePreview === k ? '2px solid #3b82f6' : '2px solid transparent', color: activePreview === k ? '#3b82f6' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: activePreview === k ? 600 : 400 }}>{LABELS[k]}</button>
            ))}
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 20, maxHeight: 500, overflow: 'auto', fontSize: 14 }}>
            {results[activePreview]?.markdown && <Markdown>{results[activePreview].markdown}</Markdown>}
            {results[activePreview]?.csv && <pre style={{ fontSize: 11, overflow: 'auto' }}>{results[activePreview].csv}</pre>}
          </div>
          {Object.entries(errors).filter(([k]) => k !== 'general').map(([k, msg]) => (
            <div key={k} style={{ marginTop: 8, padding: '8px 12px', background: '#fee2e2', borderRadius: 4, fontSize: 13, color: '#991b1b' }}>{LABELS[k]}: {msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
