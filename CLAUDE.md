# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Run both servers (recommended)
```bash
npm run dev   # concurrently: node server.js + cd client && npm run dev
```

### Backend only (Express, port 3001)
```bash
npm install
npm start            # production
npm test             # all Jest tests — sequential, force-exit
npm run test:watch

# single test file
npx jest tests/tools/testStrategy.test.js --no-coverage
# single test by name
npx jest --testNamePattern="returns results"
```

### Frontend only (React/Vite, port 5173)
```bash
cd client
npm install
npm run dev    # HMR dev server — proxies /api/* → :3001
npm run build  # production build to client/dist/
```

## Architecture

### Three-Layer Design
1. **`architecture/`** — SOPs, design docs (not loaded at runtime)
2. **`routes/`** — Express handlers, thin orchestrators, no business logic
3. **`tools/`** — All business logic: LLM calls, parsing, rendering, export

### Request Flow
```
Browser → Vite proxy → Express routes → tools/* → LLM API / Jira API
```
Express is the only process touching external APIs. Browser never calls LLM or Jira directly (CORS bypass).

### Route Mounting (`server.js`)
```
/api/config    → routes/config.js
/api/jira      → routes/jira.js
/api/templates → routes/templates.js
/api           → routes/upload.js    (POST /api/upload)
/api/llm       → routes/generate.js  (POST /api/llm/generate)
/api           → routes/export.js    (POST /api/export/download)
```

### Key Invariant: B.L.A.S.T. Protocol
LLM tools return **JSON only**. Rendering to Markdown or CSV is deterministic code — never delegated to the LLM. Every `tools/test*.js` has:
- `generateX(context, systemPrompt?)` — calls `chat()`, normalises JSON with safe defaults (TBD for missing strings, `[]` for missing arrays)
- `renderMarkdown(json)` or `toCSV(json)` — pure function, no LLM

The `systemPrompt` parameter is optional; each tool has a built-in `SYSTEM` constant as default. When a `templateId` is supplied at generate time, `routes/generate.js` reads `data/templates.json` and passes the matching `systemPrompt` instead.

### LLM Adapter (`tools/llmClient.js`)
Single `chat(messages, opts)` for three providers. Default models:
- **groq** → `openai/gpt-oss-120b` (OpenAI-compat endpoint)
- **openai** → `gpt-4o`
- **claude** → `claude-opus-4-7`

For groq/openai: `Bearer` auth, `response_format: { type: 'json_object' }`, `temperature: 0.3`.  
For claude: `x-api-key` + `anthropic-version: 2023-06-01`; system prompt is extracted from messages and sent as a top-level `system` key (Anthropic API requirement); `max_tokens: 4096`.

Vision for bug reports: groq/openai send `{ type: 'image_url', image_url: { url: 'data:...' } }`; Claude sends `{ type: 'image', source: { type: 'base64', media_type, data } }` with the `data:image/...;base64,` prefix stripped.

### Config Persistence (`routes/config.js`)
`updateEnv()` reads `.env`, merges new key=value pairs, writes back, and sets `process.env` live — running server picks up new API keys without restart. `GET /api/config/status` returns `{ llm: { configured, provider, model }, jira: { configured, url } }` — never exposes raw keys.

### Templates (`routes/templates.js` + `data/templates.json`)
Flat JSON array. Schema per entry: `{ id, name, artifactType, systemPrompt, builtIn, createdAt? }`.  
`artifactType` is one of: `testStrategy | testPlan | testCases | bugReport`.  
Built-in templates (`builtIn: true`) are read-only — PUT/DELETE return 403. Custom templates get `crypto.randomUUID()` as id.  
`load()` strips the UTF-8 BOM before parsing (Windows PowerShell `Out-File` writes BOM). `save()` always writes `'utf8'`.

### Frontend Step Flow (`client/src/App.jsx`)
4-step workflow navigator: Config → Input → Generate → Export. Steps show `done / active / idle` states derived from `llmOk`, `hasInput`, `hasArtifacts`. Templates library is a separate view accessible via the header button. `GenerateTab` accepts an `onGoTemplates` prop to navigate there from the generate screen.

### Jira Integration
- `tools/jiraClient.js` — Basic auth (base64 `email:token`); `flattenAdf()` converts Atlassian Document Format to plain text for LLM context
- `routes/jira.js /fetch` — requires all three: `JIRA_URL`, `JIRA_EMAIL`, `JIRA_TOKEN`
- `routes/jira.js /publish` — posts ADF comment back to the Jira issue

### File Upload (`routes/upload.js`)
multer writes to `.tmp/`. Temp file deleted in `finally` regardless of parse success. `tools/fileParser.js` routes by extension/MIME → pdf-parse / mammoth (docx) / xlsx.

### Export (`routes/export.js`)
`tools/exporter.js` builds a ZIP buffer in memory (archiver, no temp files). Route streams with `Content-Disposition: attachment; filename="qa-artifacts.zip"`.

## Testing

All external calls are mocked. Key patterns:
- `jest.mock('../../tools/testStrategy')` at file top, then `.mockResolvedValue({...})` in `beforeEach`
- `supertest` for route tests; `app` exported from `server.js` without calling `.listen()`
- `--runInBand` (sequential) to avoid port conflicts

## Environment Variables

```
LLM_PROVIDER=groq          # groq | openai | claude
LLM_API_KEY=
LLM_MODEL=                 # optional, defaults per provider
JIRA_URL=                  # e.g. https://yourorg.atlassian.net
JIRA_EMAIL=
JIRA_TOKEN=
PORT=3001
```

Copy `.env.example` to `.env` before first run. The Config tab in the UI can also write these at runtime.