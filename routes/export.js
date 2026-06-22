const express = require('express');
const router = express.Router();
const { buildZip } = require('../tools/exporter');

router.post('/export/download', async (req, res) => {
  const { artifacts } = req.body;
  if (!artifacts) return res.status(400).json({ error: 'artifacts required' });
  try {
    const zip = await buildZip(artifacts);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="qa-artifacts.zip"');
    res.send(zip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
