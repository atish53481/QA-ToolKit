require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

try { fs.mkdirSync(path.join(__dirname, '.tmp'), { recursive: true }); } catch {}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '20mb' }));

// Password guard — set APP_PASSWORD env var in Vercel to lock the app
if (process.env.APP_PASSWORD) {
  app.use('/api', (req, res, next) => {
    if (req.headers['x-app-password'] !== process.env.APP_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
}

app.use('/api/config', require('./routes/config'));
app.use('/api/jira', require('./routes/jira'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/samples', require('./routes/samples'));
app.use('/api', require('./routes/upload'));
app.use('/api/llm', require('./routes/generate'));
app.use('/api', require('./routes/export'));

app.get('/health', (_, res) => res.json({ ok: true }));

// Serve React build in production (Vercel + `npm start`)
const clientDist = path.join(__dirname, 'client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = app;
