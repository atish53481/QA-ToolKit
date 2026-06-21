const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseFile } = require('../tools/fileParser');

const upload = multer({ dest: path.join(__dirname, '../.tmp/') });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const buffer = fs.readFileSync(req.file.path);
    const text = await parseFile(buffer, req.file.mimetype, req.file.originalname);
    fs.unlinkSync(req.file.path);
    res.json({ text, filename: req.file.originalname });
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

module.exports = router;
