# SOP — Jira Issue Fetch (Layer 1)

**Tool:** `tools/jiraClient.js` · `fetchIssue(config, jiraId)`

## Goal
Retrieve a single Jira Cloud issue and normalize it to a flat object the test-plan generator can consume.

## Inputs
- `config.jiraUrl` — e.g. `https://your-domain.atlassian.net` (trailing slashes stripped).
- `config.jiraEmail`, `config.jiraToken` — Basic auth pair.
- `jiraId` — issue key, e.g. `VWO-48`.

## Logic
1. Build `GET {jiraUrl}/rest/api/3/issue/{key}?fields=...` (only the fields we render).
2. Auth header: `Basic base64("email:token")`.
3. On non-2xx: throw `Jira <status> fetching <key>: <body slice>`.
4. Normalize via `normalizeIssue()`.

## Edge cases / learnings
- **ADF description:** API v3 returns `description` as Atlassian Document Format (nested JSON), not text. `flattenAdf()` walks `content` recursively, keeps `text` nodes, inserts newlines around block nodes (paragraph/heading/list/blockquote/rule/hardBreak).
- **CORS:** browsers cannot call this endpoint directly → must go through the Express proxy.
- **Missing optional fields:** `priority`, `assignee`, `components`, etc. may be absent → defaults applied.

## Output shape
See `claude.md` §3c (normalized issue).


Fetch the JIRA ID and Create a Test Plan Generator
VWO-48 -> Fetch Test Plan
You please read the file of B.L.A.S.T.md again and my objective again, and create a lightweight React application which will take:

the Jira configuration
Jira email ID
Jira token
my Jira base URL
GROQ connection API details in the settings and take the JIRA ID and create the TestPlan automatically. You will be able to create a test plan based on the by fetching the vwo48 automatically. @chapter_03_BLAST_FW/B.L.A.S.T.md
GROQ - openai/gpt-oss-120b (FREE) fETCH JIRA -> emAIL, token, JIRA - VWO-48