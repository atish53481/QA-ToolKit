const { chat } = require('./llmClient');

const SYSTEM = `You are a QA Lead with 15+ years experience writing test strategies.
STRICT RULES (Anti-Hallucination):
- DO NOT invent features, APIs, error codes, UI elements, or behavior not in the provided input.
- If information is missing use "TBD" — never invent.
- Every assertion must trace to the provided requirement context.
- Output ONLY valid JSON. No prose outside JSON.`;

const SCHEMA = { title: 'string', overview: 'string', testObjectives: ['string'], testScope: { inScope: ['string'], outOfScope: ['string'] }, testTypes: ['string'], testLevels: ['string'], testTools: ['string'], testEnvironment: 'string', defectManagement: 'string', riskAnalysis: [{ risk: 'string', impact: 'string', mitigation: 'string' }], metricsAndReporting: ['string'] };

async function generateTestStrategy(context, systemPrompt = SYSTEM) {
  const raw = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate a test strategy for:\n${JSON.stringify(context, null, 2)}\n\nReturn JSON matching:\n${JSON.stringify(SCHEMA, null, 2)}` }
  ]);
  const arr = k => Array.isArray(raw[k]) ? raw[k] : [];
  return {
    title: raw.title || 'TBD', overview: raw.overview || 'TBD',
    testObjectives: arr('testObjectives'),
    testScope: { inScope: raw.testScope?.inScope || [], outOfScope: raw.testScope?.outOfScope || [] },
    testTypes: arr('testTypes'), testLevels: arr('testLevels'), testTools: arr('testTools'),
    testEnvironment: raw.testEnvironment || 'TBD', defectManagement: raw.defectManagement || 'TBD',
    riskAnalysis: arr('riskAnalysis'), metricsAndReporting: arr('metricsAndReporting')
  };
}

function renderMarkdown(s) {
  const list = a => (a || []).length ? a.map(i => `- ${i}`).join('\n') : '- TBD';
  return `# ${s.title}\n\n## Overview\n${s.overview}\n\n## Test Objectives\n${list(s.testObjectives)}\n\n## Scope\n**In Scope:**\n${list(s.testScope?.inScope)}\n\n**Out of Scope:**\n${list(s.testScope?.outOfScope)}\n\n## Test Types\n${list(s.testTypes)}\n\n## Test Levels\n${list(s.testLevels)}\n\n## Test Tools\n${list(s.testTools)}\n\n## Test Environment\n${s.testEnvironment}\n\n## Defect Management\n${s.defectManagement}\n\n## Risk Analysis\n| Risk | Impact | Mitigation |\n|------|--------|------------|\n${(s.riskAnalysis || []).map(r => `| ${r.risk} | ${r.impact} | ${r.mitigation} |`).join('\n') || '| TBD | TBD | TBD |'}\n\n## Metrics and Reporting\n${list(s.metricsAndReporting)}\n`;
}

module.exports = { generateTestStrategy, renderMarkdown };
