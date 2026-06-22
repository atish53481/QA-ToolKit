const mammoth = require('mammoth');
const XLSX = require('xlsx');

async function parseFile(buffer, mimetype, filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    // pdf-parse v1.x reads a test PDF from disk at require() time — crashes serverless.
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (ext === 'xlsx' || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    return wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n');
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = { parseFile };
