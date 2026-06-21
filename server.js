require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const tmpDir = path.join(__dirname, '.tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '20mb' }));

app.use('/api/config', require('./routes/config'));
app.use('/api/jira', require('./routes/jira'));
app.use('/api', require('./routes/upload'));
app.use('/api/llm', require('./routes/generate'));
app.use('/api', require('./routes/export'));

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = app;
