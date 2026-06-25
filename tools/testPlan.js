const { chat } = require('./llmClient');

const SYSTEM = `You are a QA Lead writing a formal 13-section test plan.
STRICT RULES: Derive everything from provided requirement. Unknown specifics → "TBD". Output ONLY valid JSON.`;

const SCHEMA = { objective: 'string', scope: { inScope: ['string'], outOfScope: ['string'] }, inclusions: ['string'], testEnvironments: ['string'], defectReporting: 'string', testStrategy: ['string'], schedule: [{ phase: 'string', owner: 'string', dates: 'string' }], deliverables: ['string'], entryCriteria: ['string'], exitCriteria: ['string'], tools: ['string'], risksAndMitigations: [{ risk: 'string', mitigation: 'string' }], approvals: [{ role: 'string', name: 'string' }] };

async function generateTestPlan(context, systemPrompt = SYSTEM, opts = {}) {
  const raw = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate a 13-section test plan for:\n${JSON.stringify(context, null, 2)}\n\nReturn JSON matching:\n${JSON.stringify(SCHEMA, null, 2)}` }
  ], opts);
  const arr = k => Array.isArray(raw[k]) ? raw[k] : [];
  return {
    objective: raw.objective || 'TBD',
    scope: { inScope: raw.scope?.inScope || [], outOfScope: raw.scope?.outOfScope || [] },
    inclusions: arr('inclusions'), testEnvironments: arr('testEnvironments'),
    defectReporting: raw.defectReporting || 'TBD',
    testStrategy: arr('testStrategy'), schedule: arr('schedule'),
    deliverables: arr('deliverables'), entryCriteria: arr('entryCriteria'),
    exitCriteria: arr('exitCriteria'), tools: arr('tools'),
    risksAndMitigations: arr('risksAndMitigations'), approvals: arr('approvals')
  };
}

function renderMarkdown(p) {
  const list = a => (a || []).length ? a.map(i => `- ${i}`).join('\n') : '- TBD';
  return `# Test Plan\n\n## 1. Objective\n${p.objective}\n\n## 2. Scope\n**In Scope:**\n${list(p.scope?.inScope)}\n\n**Out of Scope:**\n${list(p.scope?.outOfScope)}\n\n## 3. Inclusions\n${list(p.inclusions)}\n\n## 4. Test Environments\n${list(p.testEnvironments)}\n\n## 5. Defect Reporting\n${p.defectReporting}\n\n## 6. Test Strategy\n${list(p.testStrategy)}\n\n## 7. Schedule\n| Phase | Owner | Dates |\n|-------|-------|-------|\n${(p.schedule || []).map(s => `| ${s.phase} | ${s.owner} | ${s.dates} |`).join('\n') || '| TBD | TBD | TBD |'}\n\n## 8. Deliverables\n${list(p.deliverables)}\n\n## 9. Entry Criteria\n${list(p.entryCriteria)}\n\n## 10. Exit Criteria\n${list(p.exitCriteria)}\n\n## 11. Tools\n${list(p.tools)}\n\n## 12. Risks & Mitigations\n| Risk | Mitigation |\n|------|------------|\n${(p.risksAndMitigations || []).map(r => `| ${r.risk} | ${r.mitigation} |`).join('\n') || '| TBD | TBD |'}\n\n## 13. Approvals\n| Role | Name |\n|------|------|\n${(p.approvals || []).map(a => `| ${a.role} | ${a.name} |`).join('\n') || '| TBD | TBD |'}\n`;
}

module.exports = { generateTestPlan, renderMarkdown };
