'use strict';
const archiver = require('archiver');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const NAMES = { testStrategy: 'Test Strategy', testPlan: 'Test Plan', testCases: 'Test Cases', bugReport: 'Bug Report' };

function parseCSVLine(line) {
  const cells = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  cells.push(cur.trim());
  return cells;
}

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/th>/gi, '  |  ')
    .replace(/<\/td>/gi, '  |  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToPdfBuffer(html, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 55, size: 'A4', info: { Title: title || 'QA Document' } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const text = stripHtml(html);
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line) { doc.moveDown(0.4); continue; }
      if (line.startsWith('# ')) {
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e1b4b').text(line.slice(2).trim()).moveDown(0.3);
      } else if (line.startsWith('## ')) {
        doc.fontSize(15).font('Helvetica-Bold').fillColor('#312e81').text(line.slice(3).trim()).moveDown(0.2);
      } else if (line.startsWith('### ')) {
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#4338ca').text(line.slice(4).trim()).moveDown(0.2);
      } else if (line.startsWith('#### ')) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#4f46e5').text(line.slice(5).trim()).moveDown(0.1);
      } else if (line.startsWith('•')) {
        doc.fontSize(11).font('Helvetica').fillColor('#374151').text(`  ${line}`, { paragraphGap: 2 });
      } else {
        doc.fontSize(11).font('Helvetica').fillColor('#374151').text(line, { paragraphGap: 3 });
      }
    }
    doc.end();
  });
}

async function htmlToDocxBuffer(html, title) {
  const text = stripHtml(html);
  const children = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { children.push(new Paragraph({})); continue; }
    if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: line.slice(2).trim(), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.slice(3).trim(), heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.slice(4).trim(), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('#### ')) {
      children.push(new Paragraph({ text: line.slice(5).trim(), heading: HeadingLevel.HEADING_4 }));
    } else if (line.startsWith('•')) {
      children.push(new Paragraph({ text: line.slice(1).trim(), bullet: { level: 0 } }));
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: line })] }));
    }
  }
  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

async function buildZip(artifacts) {
  const chunks = [];
  const archive = archiver('zip', { zlib: { level: 6 } });
  const archiveFinished = new Promise((resolve, reject) => {
    archive.on('data', c => chunks.push(c));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  for (const [key, artifact] of Object.entries(artifacts || {})) {
    if (!artifact || !NAMES[key]) continue;
    const rawContent = artifact.content ?? artifact.markdown ?? artifact.csv;
    if (!rawContent) continue;
    const rawFmt = artifact.rawFormat;
    const name = NAMES[key];

    try {
      if (rawFmt === 'pdf') {
        archive.append(await htmlToPdfBuffer(String(rawContent), name), { name: `${name}.pdf` });
      } else if (rawFmt === 'docx') {
        archive.append(await htmlToDocxBuffer(String(rawContent), name), { name: `${name}.docx` });
      } else if (rawFmt === 'xlsx') {
        const str = String(rawContent);
        const firstLine = str.split('\n')[0] || '';
        const isCSV = firstLine.split(',').length > 2;
        const rows = isCSV
          ? str.trim().split('\n').map(parseCSVLine)
          : str.trim().split('\n').filter(l => l.trim()).map(l => [l.replace(/^#+\s*/, '').trim()]);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
        archive.append(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), { name: `${name}.xlsx` });
      } else {
        const extension = artifact.ext ?? (artifact.csv ? '.csv' : '.md');
        archive.append(String(rawContent), { name: `${name}${extension}` });
      }
    } catch {
      archive.append(String(rawContent), { name: `${name}${artifact.ext ?? '.txt'}` });
    }
  }

  archive.finalize();
  return archiveFinished;
}

module.exports = { buildZip };
