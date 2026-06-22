const express = require('express');
const router = express.Router();
const path = require('path');

const SAMPLES_DIR = path.join(__dirname, '../data/samples');

router.get('/prd', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="Sample-PRD-Authentication.md"');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.sendFile(path.join(SAMPLES_DIR, 'prd-sample.md'));
});

module.exports = router;
