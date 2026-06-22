import { useState, useEffect } from 'react';
import ConfigTab from './tabs/ConfigTab';
import InputTab from './tabs/InputTab';
import GenerateTab from './tabs/GenerateTab';
import ExportTab from './tabs/ExportTab';
import TemplatesTab from './tabs/TemplatesTab';

const STEPS = [
  { key: 'Config', icon: '⚙️', label: 'Config', desc: 'LLM & Jira setup' },
  { key: 'Input', icon: '📄', label: 'Input', desc: 'Load requirements' },
  { key: 'Generate', icon: '⚡', label: 'Generate', desc: 'AI artifacts' },
  { key: 'Export', icon: '📦', label: 'Export', desc: 'Download / Publish' },
];

const GS = `
  *{box-sizing:border-box}
  body{margin:0;background:#f0f2f8;font-family:'Inter',system-ui,sans-serif}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .tab-pane{animation:fadeIn 0.18s ease}
  .step-btn:hover .step-inner{background:#eef2ff;border-color:#818cf8}
  .tmpl-link:hover{background:rgba(255,255,255,0.18)!important}
`;

export default function App() {
  const [tab, setTab] = useState('Config');
  const [configStatus, setConfigStatus] = useState({ llm: { configured: false }, jira: { configured: false } });
  const [context, setContext] = useState({ source: 'file', jiraIssue: null, fileText: '', screenshotB64: '', projectId: '' });
  const [artifacts, setArtifacts] = useState(null);

  useEffect(() => { fetch('/api/config/status').then(r => r.json()).then(setConfigStatus).catch(() => {}); }, []);

  const llmOk = configStatus.llm?.configured;
  const hasInput = !!(context.jiraIssue || context.fileText || context.screenshotB64);
  const hasArtifacts = !!(artifacts && Object.keys(artifacts).length > 0);

  const stepSt = {
    Config: llmOk ? 'done' : 'active',
    Input: hasInput ? 'done' : (llmOk ? 'active' : 'idle'),
    Generate: hasArtifacts ? 'done' : (hasInput ? 'active' : 'idle'),
    Export: hasArtifacts ? 'active' : 'idle',
  };

  const C = { done: '#10b981', active: '#6366f1', idle: '#94a3b8' };

  return (
    <>
      <style>{GS}</style>
      <div style={{ minHeight: '100vh', background: '#f0f2f8' }}>

        {/* ── Header ── */}
        <header style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4338ca 100%)', padding: '0 24px', boxShadow: '0 4px 20px rgba(30,27,75,.45)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#818cf8,#a78bfa)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 10px rgba(129,140,248,.5)' }}>🧪</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 19, letterSpacing: '-0.4px' }}>QA Generator</div>
                <div style={{ color: '#a5b4fc', fontSize: 11, letterSpacing: '0.3px' }}>AI-POWERED TEST ARTIFACT SUITE</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: llmOk ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)', border: `1px solid ${llmOk ? '#10b981' : '#ef4444'}` }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: llmOk ? '#10b981' : '#ef4444', boxShadow: llmOk ? '0 0 8px #10b981' : 'none' }} />
                <span style={{ color: llmOk ? '#34d399' : '#f87171', fontSize: 11, fontWeight: 700 }}>{llmOk ? 'LLM READY' : 'LLM OFFLINE'}</span>
              </div>
              <button className="tmpl-link" onClick={() => setTab('Templates')}
                style={{ padding: '6px 14px', borderRadius: 20, background: tab === 'Templates' ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.22)', color: '#e0e7ff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background .15s' }}>
                📋 Templates
              </button>
            </div>
          </div>
        </header>

        {/* ── Step Nav ── */}
        {tab !== 'Templates' && (
          <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex' }}>
              {STEPS.map((s, i) => {
                const st = stepSt[s.key];
                const active = tab === s.key;
                return (
                  <button key={s.key} className="step-btn" onClick={() => setTab(s.key)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, padding: 0, background: 'none', border: 'none', cursor: 'pointer', borderBottom: active ? `3px solid ${C[st]}` : '3px solid transparent', transition: 'border-color .15s' }}>
                    <div className="step-inner" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderRadius: 0, background: active ? (st === 'done' ? '#f0fdf4' : '#eef2ff') : 'transparent', transition: 'background .15s' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: st === 'done' ? '#10b981' : (active ? C[st] : '#f1f5f9'), border: `2px solid ${st === 'done' ? '#10b981' : (active ? C[st] : '#e2e8f0')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                        {st === 'done' ? <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>✓</span> : <span style={{ fontSize: active ? 16 : 14 }}>{s.icon}</span>}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Step {i + 1}</div>
                        <div style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: active ? C[st] : '#374151', transition: 'color .15s' }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.desc}</div>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && <div style={{ color: '#cbd5e1', fontSize: 20, paddingRight: 4, flexShrink: 0 }}>›</div>}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Templates breadcrumb */}
        {tab === 'Templates' && (
          <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, height: 46 }}>
              <button onClick={() => setTab('Config')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>← Back to workflow</button>
              <span style={{ color: '#e2e8f0' }}>|</span>
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>📋 Template Library</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>Customize how each artifact is generated</span>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
          <div className="tab-pane" key={tab}>
            {tab === 'Config'     && <ConfigTab configStatus={configStatus} onStatusChange={setConfigStatus} />}
            {tab === 'Input'      && <InputTab configStatus={configStatus} context={context} onContextChange={setContext} />}
            {tab === 'Generate'   && <GenerateTab context={context} onArtifacts={setArtifacts} onGoTemplates={() => setTab('Templates')} />}
            {tab === 'Export'     && <ExportTab artifacts={artifacts} configStatus={configStatus} context={context} />}
            {tab === 'Templates'  && <TemplatesTab />}
          </div>
        </main>
      </div>
    </>
  );
}
