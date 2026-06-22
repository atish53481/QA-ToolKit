import LLMCard from '../components/LLMCard';
import JiraCard from '../components/JiraCard';

const PRD_SECTIONS = [
  { icon: '📋', label: 'User Stories and Acceptance Criteria' },
  { icon: '📊', label: 'Functional Requirements table (P0/P1)' },
  { icon: '🔐', label: 'Non-Functional Requirements (performance, security)' },
  { icon: '🌐', label: 'API Endpoints and Error Codes' },
  { icon: '❓', label: 'Open Questions and Out of Scope' },
];

export default function ConfigTab({ configStatus, onStatusChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
      <div style={{ maxWidth: 560 }}>
        <LLMCard configStatus={configStatus.llm} onStatusChange={onStatusChange} />
        <JiraCard configStatus={configStatus.jira} onStatusChange={onStatusChange} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 12 }}>🚀 Getting Started</div>
          {[
            { step: 1, icon: '⚙️', label: 'Configure LLM', desc: 'Add your API key (Groq is free)' },
            { step: 2, icon: '📄', label: 'Load Requirements', desc: 'Upload a PRD file or paste a Jira issue' },
            { step: 3, icon: '⚡', label: 'Generate Artifacts', desc: 'Select what to generate and pick a template' },
            { step: 4, icon: '📦', label: 'Export', desc: 'Download ZIP or publish directly to Jira' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '2px solid #c7d2fe', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 26 }}>📘</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#312e81' }}>Sample PRD — Demo Input</div>
              <div style={{ fontSize: 12, color: '#6366f1' }}>User Authentication and Account Management</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#4338ca', lineHeight: 1.6, margin: '0 0 12px' }}>
            New to the tool? Download this ready-to-use Product Requirements Document. Upload it in the <strong>Input</strong> tab to instantly generate a full set of QA artifacts as a demo.
          </p>
          <div style={{ fontSize: 11, color: '#6366f1', marginBottom: 14 }}>
            <strong>Includes:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, lineHeight: 2 }}>
              {PRD_SECTIONS.map((s, i) => <li key={i}>{s.icon} {s.label}</li>)}
            </ul>
          </div>
          <a href="/api/samples/prd" download style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 10px rgba(99,102,241,.4)' }}>
            ⬇️ Download Sample PRD
          </a>
          <div style={{ fontSize: 11, color: '#818cf8', marginTop: 8 }}>Markdown file · ShopEase Authentication · Sprint 14</div>
        </div>
      </div>
    </div>
  );
}