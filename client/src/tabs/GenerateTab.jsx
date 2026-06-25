import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { apiFetch, getLLMConfig } from '../api';

const KEYS = ['testStrategy', 'testPlan', 'testCases', 'bugReport'];

const M = {
  testStrategy: { icon: '🗺️', label: 'Test Strategy', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', desc: 'Scope, risk, tools & QA approach' },
  testPlan:     { icon: '📋', label: 'Test Plan',     color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', desc: '13-section formal SPO document' },
  testCases:    { icon: '🧪', label: 'Test Cases',    color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', desc: 'Positive & negative scenario coverage' },
  bugReport:    { icon: '🐛', label: 'Bug Report',    color: '#ef4444', bg: '#fff1f2', border: '#fecdd3', desc: 'Vision-based screenshot analysis' },
};

export default function GenerateTab({ context, onArtifacts, onGoTemplates }) {
  const hasScreenshot = !!context.screenshotB64;
  const hasInput = !!(context.jiraIssue || context.fileText || context.screenshotB64);
  const [selected, setSelected] = useState({ testStrategy: true, testPlan: true, testCases: true, bugReport: false });
  const [templateIds, setTemplateIds] = useState({ testStrategy: '', testPlan: '', testCases: '', bugReport: '' });
  const [templates, setTemplates] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [activePreview, setActivePreview] = useState('testStrategy');

  useEffect(() => {
    apiFetch('/api/templates').then(r => r.json()).then(setTemplates).catch(() => {});
  }, []);

  const toggle = (k) => { if (k === 'bugReport' && !hasScreenshot) return; setSelected(p => ({ ...p, [k]: !p[k] })); };

  const handleGenerate = async () => {
    setGenerating(true); setResults(null); setErrors({}); setProgress('Sending to AI...');
    try {
      const r = await apiFetch('/api/llm/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, artifacts: selected, templateIds, llmConfig: getLLMConfig() })
      });
      setProgress('Processing results...');
      const data = await r.json();
      setResults(data.results); setErrors(data.errors || {});
      onArtifacts(data.results);
      const first = KEYS.find(k => data.results?.[k]);
      if (first) setActivePreview(first);
    } catch (err) { setErrors({ general: err.message }); }
    finally { setGenerating(false); setProgress(null); }
  };

  const templatesFor = (key) => templates.filter(t => t.artifactType === key);
  const selectedCount = KEYS.filter(k => selected[k]).length;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Input status banner */}
      {!hasInput && (
        <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: 10, color: '#92400e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #fde68a', fontSize: 13 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span><strong>No input loaded.</strong> Go to the Input tab to load a Jira issue, upload a file, or attach a screenshot.</span>
        </div>
      )}
      {hasInput && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', borderRadius: 10, color: '#166534', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #bbf7d0', fontSize: 13 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span>
            <strong>Input ready.</strong>
            {context.jiraIssue && ` Jira: ${context.jiraIssue.key}.`}
            {context.fileText && ` File: ${context.fileText.length.toLocaleString()} chars.`}
            {context.screenshotB64 && ' Screenshot attached.'}
          </span>
        </div>
      )}

      {/* Artifact selection cards */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
          Select artifacts to generate <span style={{ color: '#94a3b8', fontWeight: 400 }}>({selectedCount} selected)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {KEYS.map(k => {
            const m = M[k];
            const locked = k === 'bugReport' && !hasScreenshot;
            const done = results?.[k];
            const err = errors[k];
            const sel = selected[k];
            return (
              <div key={k} onClick={() => toggle(k)} style={{
                padding: '16px 14px', borderRadius: 12,
                border: `2px solid ${err ? '#fca5a5' : (done ? '#86efac' : (sel ? m.color : '#e2e8f0'))}`,
                background: err ? '#fff1f2' : (done ? '#f0fdf4' : (sel ? m.bg : '#fff')),
                cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.45 : 1,
                transition: 'all .18s', boxShadow: sel && !done ? `0 2px 10px ${m.color}28` : 'none', position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: err ? '#ef4444' : (done ? '#10b981' : (sel ? m.color : '#e2e8f0')) }} />
                <div style={{ fontSize: 26, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: sel ? m.color : '#374151', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: 10 }}>{m.desc}</div>
                {done && <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>✓ Done</div>}
                {err && <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>⚠ Error</div>}
                {locked && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Needs screenshot</div>}
                {sel && !locked && (
                  <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Template to use</div>
                    <select value={templateIds[k]} onChange={e => setTemplateIds(p => ({ ...p, [k]: e.target.value }))}
                      style={{ width: '100%', fontSize: 11, padding: '5px 7px', borderRadius: 6, border: `1.5px solid ${templateIds[k] ? m.color : m.border}`, color: templateIds[k] ? m.color : '#374151', background: templateIds[k] ? m.bg : '#fff', fontWeight: templateIds[k] ? 700 : 400 }}>
                      <option value="">Default (built-in)</option>
                      {templatesFor(k).map(t => <option key={t.id} value={t.id}>{t.builtIn ? '🔒' : '✏️'} {t.name}</option>)}
                    </select>
                    {templateIds[k] && (
                      <div style={{ fontSize: 10, color: m.color, marginTop: 3, fontWeight: 600 }}>
                        ✓ Using: {templates.find(t => t.id === templateIds[k])?.name || 'Custom template'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Template hint */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>💡</span>
        <span>Each card uses the built-in template by default. Want custom instructions? Go to</span>
        {onGoTemplates && (
          <button onClick={onGoTemplates} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
            Templates →
          </button>
        )}
      </div>

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={generating || !hasInput || selectedCount === 0}
        style={{ padding: '12px 32px', fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 10, cursor: (generating || !hasInput || selectedCount === 0) ? 'not-allowed' : 'pointer', background: (generating || !hasInput || selectedCount === 0) ? '#94a3b8' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: (generating || !hasInput) ? 'none' : '0 4px 14px rgba(99,102,241,.45)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s' }}>
        {generating ? (
          <>
            <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            {progress || 'Generating...'}
          </>
        ) : (
          <>⚡ Generate {selectedCount > 0 ? `${selectedCount} Artifact${selectedCount > 1 ? 's' : ''}` : ''}</>
        )}
      </button>

      {errors.general && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 13, border: '1px solid #fca5a5' }}>
          ⚠️ {errors.general}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
            Generated Artifacts — <span style={{ color: '#10b981' }}>{KEYS.filter(k => results[k]).length} ready</span>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
              {KEYS.filter(k => results[k]).map(k => {
                const m = M[k];
                return (
                  <button key={k} onClick={() => setActivePreview(k)}
                    style={{ flex: 1, padding: '12px 8px', background: 'none', border: 'none', borderBottom: activePreview === k ? `3px solid ${m.color}` : '3px solid transparent', color: activePreview === k ? m.color : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: activePreview === k ? 700 : 500, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'column' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{m.icon} {m.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: activePreview === k ? m.color : '#94a3b8', opacity: 0.85 }}>{(results[k]?.ext || '.md').toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '20px 24px', maxHeight: 520, overflow: 'auto', fontSize: 14, lineHeight: 1.7 }}>
              {(() => {
                const r = results[activePreview];
                if (!r) return null;
                const fmt = r.format || (r.csv ? 'csv' : 'markdown');
                const content = r.content ?? r.markdown ?? r.csv ?? '';
                const binaryNote = ['pdf','docx','xlsx'].includes(r.rawFormat);
                return (
                  <>
                    {binaryNote && (
                      <div style={{ marginBottom: 12, padding: '8px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>ℹ️</span>
                        <span>PDF/Word/Excel export requires a native library — delivered as <strong>HTML / CSV</strong>. To get a real PDF: open the downloaded file in Chrome → <em>Print → Save as PDF</em>.</span>
                      </div>
                    )}
                    {fmt === 'markdown' && <Markdown>{content}</Markdown>}
                    {fmt === 'html' && <iframe srcDoc={content} title="preview" style={{ width: '100%', minHeight: 440, border: 'none', borderRadius: 6 }} />}
                    {fmt !== 'markdown' && fmt !== 'html' && <pre style={{ fontSize: 12, overflow: 'auto', background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', lineHeight: 1.5 }}>{content}</pre>}
                  </>
                );
              })()}
            </div>
          </div>
          {Object.entries(errors).filter(([k]) => k !== 'general').map(([k, msg]) => (
            <div key={k} style={{ marginTop: 8, padding: '8px 14px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#991b1b', border: '1px solid #fca5a5' }}>
              {M[k]?.icon} {M[k]?.label}: {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
