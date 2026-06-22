# QA Generator

Generate Test Strategy, Test Plan, Test Cases, and Bug Reports from Jira issues, uploaded documents, or screenshots.

---

## Prerequisites

- **Node.js** v18+
- A **GROQ API key** (free at https://console.groq.com) — or Claude / OpenAI key
- Optional: Jira Cloud account + API token

---

## First-Time Setup

### 1. Install backend dependencies

```bash
cd "C:\Users\atish\Documents\App\Test Strategy Plan Cases Bug"
npm install
```

### 2. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 3. Create your .env file

```bash
copy .env.example .env
```

Open `.env` and set at minimum:

```
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key_here
LLM_MODEL=openai/gpt-oss-120b
PORT=3001
```

> You can also leave `.env` empty and configure everything from the Config tab in the app.

---

## Start the Application

You need **two terminals** open at the same time.

### Terminal 1 — Backend (Express API, port 3001)

```bash
cd "C:\Users\atish\Documents\App\Test Strategy Plan Cases Bug"
node server.js
```

Expected:
```
Server on http://localhost:3001
```

### Terminal 2 — Frontend (React/Vite, port 5173)

```bash
cd "C:\Users\atish\Documents\App\Test Strategy Plan Cases Bug\client"
npm run dev
```

Expected:
```
  VITE v5.x  ready in xxx ms
  Local: http://localhost:5173/
```

### Open the app

**http://localhost:5173**

---

## Using the App

### Step 1 — Config tab

1. Select provider: **GROQ** (recommended, free)
2. Paste API key
3. Click **Test and Save** — green badge = connected
4. *(Optional)* Fill Jira URL + email + token → **Verify and Save**

### Step 2 — Input tab

| Column | Action |
|--------|--------|
| **Jira Issue ID** | Enter project + issue ID (e.g. `VWO-48`) → Fetch |
| **Import File** | Drag-drop a PDF, DOCX, or XLSX requirements doc |
| **Screenshot** | Drag-drop a PNG/JPG — enables Bug Report generation |

Combine all three for richer output.

### Step 3 — Generate tab

1. Check artifacts: Test Strategy, Test Plan, Test Cases, Bug Report
2. Click **Generate**
3. Results appear in Markdown preview sub-tabs

### Step 4 — Export tab

| Button | Output |
|--------|--------|
| **Download ZIP** | `qa-artifacts.zip` with .md + .csv files |
| **Publish to Jira** | Posts artifacts as comment on the Jira issue |

---

## Run Tests

```bash
cd "C:\Users\atish\Documents\App\Test Strategy Plan Cases Bug"
npm test
```

Expected: **29 tests pass, 10 suites.**

---

## Project Structure

```
├── server.js              # Express entry point (port 3001)
├── routes/
│   ├── config.js          # /api/config — LLM + Jira credentials
│   ├── jira.js            # /api/jira/fetch + /publish
│   ├── upload.js          # /api/upload — file parsing
│   ├── generate.js        # /api/llm/generate — orchestrator
│   └── export.js          # /api/export/download — ZIP
├── tools/
│   ├── llmClient.js       # GROQ / Claude / OpenAI adapter
│   ├── jiraClient.js      # Jira REST + ADF flattening
│   ├── fileParser.js      # PDF / DOCX / XLSX extraction
│   ├── testStrategy.js    # Test Strategy generator
│   ├── testPlan.js        # Test Plan generator (13-section SPO)
│   ├── testCases.js       # Test Cases generator (RICE-POT, CSV)
│   ├── bugReport.js       # Bug Report generator (vision LLM)
│   └── exporter.js        # ZIP builder
├── client/                # React / Vite frontend (port 5173)
│   └── src/
│       ├── App.jsx
│       ├── tabs/          # ConfigTab InputTab GenerateTab ExportTab
│       └── components/    # LLMCard JiraCard JiraInput FileInput ScreenshotInput
├── tests/                 # Jest + Supertest (29 tests)
├── .env.example
└── .env                   # Your keys — never committed
```

---

## LLM Providers

| Provider | Default Model | Vision Support |
|----------|--------------|----------------|
| GROQ | openai/gpt-oss-120b | llama-3.2-11b-vision-preview |
| Claude | claude-opus-4-7 | claude-opus-4-7 |
| OpenAI | gpt-4o | gpt-4o |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Cannot connect to server | Run `node server.js` in Terminal 1 |
| LLM 401 error | Wrong or expired API key — re-enter in Config tab |
| LLM 429 error | Rate limit — wait and retry |
| Jira not configured | Fill all three Jira fields and click Verify |
| Bug Report greyed out | Attach a screenshot in Input tab first |
| Port 3001 in use | Set `PORT=3002` in `.env` |
