const { chat } = require('./llmClient');

const SYSTEM = `You are a QA Engineer analyzing a screenshot to identify bugs.
STRICT RULES: Report ONLY defects visible or directly inferable from the screenshot. DO NOT invent bugs. If nothing is wrong return {"bugs":[]}. Output ONLY valid JSON.`;

const SCHEMA = { bugs: [{ bugId: 'BUG-NNN', title: 'string', description: 'string', severity: 'Critical|High|Medium|Low', priority: 'High|Medium|Low', stepsToReproduce: ['string'], expectedBehavior: 'string', actualBehavior: 'string', environment: 'string' }] };

async function generateBugReport(screenshotB64, context) {
  const provider = process.env.LLM_PROVIDER || 'groq';
  const prompt = `Analyze this screenshot for bugs. Context: ${JSON.stringify(context)}\n\nReturn JSON matching:\n${JSON.stringify(SCHEMA, null, 2)}`;
  const userContent = provider === 'claude'
    ? [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotB64.replace(/^data:image\/\w+;base64,/, '') } }, { type: 'text', text: prompt }]
    : [{ type: 'image_url', image_url: { url: screenshotB64 } }, { type: 'text', text: prompt }];

  const raw = await chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: userContent }]);
  return (Array.isArray(raw.bugs) ? raw.bugs : []).map((bug, i) => ({
    bugId: bug.bugId || `BUG-${String(i + 1).padStart(3, '0')}`,
    title: bug.title || 'TBD', description: bug.description || 'TBD',
    severity: bug.severity || 'Medium', priority: bug.priority || 'Medium',
    stepsToReproduce: Array.isArray(bug.stepsToReproduce) ? bug.stepsToReproduce : [],
    expectedBehavior: bug.expectedBehavior || 'TBD', actualBehavior: bug.actualBehavior || 'TBD',
    environment: bug.environment || 'TBD', attachments: ['Screenshot provided']
  }));
}

function renderMarkdown(bugs) {
  if (!bugs.length) return '# Bug Report\n\nNo bugs identified from the provided screenshot.';
  return `# Bug Report\n\n${bugs.map(b => `## ${b.bugId}: ${b.title}\n\n**Severity:** ${b.severity} | **Priority:** ${b.priority}\n\n**Description:** ${b.description}\n\n**Steps to Reproduce:**\n${b.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n') || '1. TBD'}\n\n**Expected:** ${b.expectedBehavior}\n**Actual:** ${b.actualBehavior}\n\n**Environment:** ${b.environment}\n`).join('\n---\n\n')}`;
}

module.exports = { generateBugReport, renderMarkdown };
