# SOP — GROQ Test Plan Generation (Layer 1)

**Tools:** `tools/groqClient.js` · `groqChat()` and `tools/testPlan.js` · `generateTestPlan()` / `renderMarkdown()`

## Goal
Turn a normalized Jira issue into a structured Test Plan object, then render deterministic Markdown.

## Model
- `openai/gpt-oss-120b` (GROQ, FREE).
- Endpoint: `POST https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible).
- Auth: `Authorization: Bearer <GROQ_KEY>`.

## Logic
1. `buildMessages(issue)` — system prompt sets the QA-Lead persona + "do not fabricate" rule; user prompt carries the issue fields + the exact JSON schema.
2. `groqChat()` calls GROQ with `response_format: { type: "json_object" }`, `temperature: 0.3`.
3. Parse JSON; on parse failure throw `GROQ did not return valid JSON`.
4. `generateTestPlan()` defensively normalizes every key (arrays default to `[]`, strings to `TBD`).
5. `renderMarkdown()` deterministically builds the `.md` (no LLM in this step).

## The deterministic boundary (BLAST)
LLM = probabilistic content. Markdown layout, tables, and file I/O = deterministic code. Never let the LLM control formatting or file writes.

## Edge cases / learnings
- Free tier may rate-limit → surface `GROQ <status>` to the UI.
- Schema drift: defensive defaults in `generateTestPlan()` keep the renderer crash-proof.

## Output shape
See `gemini.md` §3d (Test Plan payload).
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
See `gemini.md` §3c (normalized issue).