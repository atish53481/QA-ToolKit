const { chat } = require('./llmClient');

const SYSTEM = `You are an expert QA Functional Tester with 15+ years experience (RICE-POT framework).
STRICT RULES (Anti-Hallucination):
- DO NOT invent features, APIs, error codes, UI elements, or behavior not in the provided requirement.
- Cover both valid (positive) and invalid (negative) scenarios. Minimum 10 test cases.
- Trace every test case to a specific requirement.
- Missing/unclear info → use "Insufficient information to determine." for that field.
- Output ONLY valid JSON.`;

const SCHEMA = { testCases: [{ scenario: 'string', tid: 'TC-NNN', testData: 'string', testCaseDescription: 'string', preCondition: 'string', testSteps: 'string', expectedResult: 'string', priority: 'High|Medium|Low', isAutomated: 'Yes|No', misc: 'string' }] };

async function generateTestCases(context) {
  const raw = await chat([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Generate test cases for:\n${JSON.stringify(context, null, 2)}\n\nReturn JSON matching:\n${JSON.stringify(SCHEMA, null, 2)}` }
  ]);
  return (Array.isArray(raw.testCases) ? raw.testCases : []).map((tc, i) => ({
    scenario: tc.scenario || 'TBD',
    tid: tc.tid || `TC-${String(i + 1).padStart(3, '0')}`,
    testData: tc.testData || '', testCaseDescription: tc.testCaseDescription || 'TBD',
    preCondition: tc.preCondition || '', testSteps: tc.testSteps || '',
    expectedResult: tc.expectedResult || 'TBD',
    actualResult: '', status: 'Not Executed', executedBy: '',
    misc: tc.misc || '', priority: tc.priority || 'Medium', isAutomated: tc.isAutomated || 'No'
  }));
}

function toCSV(cases) {
  const HEADERS = ['Scenario','TID','Test Data','Test Case Description','Pre-Condition','Test Steps','Expected Result','Actual Result','Status','Executed By (QA Name)','Misc (Comments)','Priority','Is Automated'];
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const rows = cases.map(tc => [tc.scenario, tc.tid, tc.testData, tc.testCaseDescription, tc.preCondition, tc.testSteps, tc.expectedResult, tc.actualResult, tc.status, tc.executedBy, tc.misc, tc.priority, tc.isAutomated].map(esc).join(','));
  return [HEADERS.join(','), ...rows].join('\n');
}

module.exports = { generateTestCases, toCSV };
