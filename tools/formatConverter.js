'use strict';

// Actual file extension delivered for each format value
const EXTS = { markdown: '.md', html: '.html', txt: '.txt', csv: '.csv', json: '.json', pdf: '.pdf', docx: '.docx', xlsx: '.xlsx' };
// Maps unsupported binary formats → closest text format for content generation
const FALLBACK = { pdf: 'html', docx: 'html', xlsx: 'csv' };
const resolveFormat = (fmt) => FALLBACK[fmt] || fmt;   // json stays json, md stays md, etc.
const ext = (format) => EXTS[format] || '.md';

const CSS = `
body{font-family:system-ui,sans-serif;max-width:960px;margin:40px auto;padding:0 28px;line-height:1.7;color:#374151}
h1{color:#1e1b4b;border-bottom:3px solid #6366f1;padding-bottom:10px;font-size:2em;margin-bottom:24px}
h2{color:#312e81;margin-top:2em;font-size:1.3em;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
h3{color:#4338ca;margin-top:1.5em}h4{color:#4f46e5}
table{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.9em}
th{background:#eef2ff;padding:10px 14px;border:1px solid #c7d2fe;text-align:left;font-weight:700;color:#312e81}
td{padding:9px 14px;border:1px solid #e5e7eb}tr:nth-child(even)td{background:#f8fafc}
ul,ol{padding-left:24px;margin:.6em 0}li{margin:.3em 0}
strong{color:#1e293b}em{color:#4338ca}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:.88em;font-family:monospace}
pre{background:#1e293b;color:#e2e8f0;padding:16px 20px;border-radius:8px;overflow-x:auto;font-size:.88em}
pre code{background:none;padding:0;color:inherit}
hr{border:none;border-top:2px solid #e2e8f0;margin:2em 0}
blockquote{border-left:4px solid #6366f1;margin:0;padding:8px 16px;color:#6b7280;background:#f8fafc;border-radius:0 6px 6px 0}
p{margin:.75em 0}`.trim();

function inl(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseTableRow(line) {
  return line.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
}

function mdToHtml(md, title) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const code = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      out.push(`<pre><code class="language-${lang}">${esc(code.join('\n'))}</code></pre>`);
      i++; continue;
    }
    const hm = line.match(/^(#{1,4})\s+(.+)$/);
    if (hm) { out.push(`<h${hm[1].length}>${inl(hm[2])}</h${hm[1].length}>`); i++; continue; }
    if (line.match(/^[-*_]{3,}$/)) { out.push('<hr>'); i++; continue; }
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[\s\-:|]+\|/)) {
      const headers = parseTableRow(line); i += 2;
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(parseTableRow(lines[i])); i++; }
      out.push(`<table><thead><tr>${headers.map(h => `<th>${inl(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (line.match(/^[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) { items.push(`<li>${inl(lines[i].replace(/^[-*]\s/, ''))}</li>`); i++; }
      out.push(`<ul>${items.join('')}</ul>`); continue;
    }
    if (line.match(/^\d+\.\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) { items.push(`<li>${inl(lines[i].replace(/^\d+\.\s/, ''))}</li>`); i++; }
      out.push(`<ol>${items.join('')}</ol>`); continue;
    }
    if (line.startsWith('> ')) {
      const bq = [];
      while (i < lines.length && lines[i].startsWith('> ')) { bq.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote>${bq.map(inl).join('<br>')}</blockquote>`); continue;
    }
    if (!line.trim()) { i++; continue; }
    const para = [line]; i++;
    while (i < lines.length && lines[i].trim() &&
      !lines[i].match(/^#{1,4}\s|^\||^[-*]\s|^\d+\.\s|^```|^[-*_]{3,}$|^>\s/)) {
      para.push(lines[i]); i++;
    }
    out.push(`<p>${inl(para.join(' '))}</p>`);
  }
  const docTitle = title || (md.match(/^# (.+)$/m)?.[1]) || 'QA Document';
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${esc(docTitle)}</title>\n<style>${CSS}</style>\n</head>\n<body>\n${out.join('\n')}\n</body>\n</html>`;
}

function mdToText(md) {
  return md
    .replace(/```[\s\S]*?```/g, m => m.replace(/```\w*\n?/g, '').trim())
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\|(.+)\|$/gm, l => l.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/)).join('  '))
    .replace(/^\|[-\s|:]+\|$/gm, '─'.repeat(60))
    .replace(/^[-*]\s/gm, '  • ').replace(/^\d+\.\s/gm, m => `  ${m}`)
    .replace(/^[-*_]{3,}$/gm, '─'.repeat(60))
    .replace(/\n{3,}/g, '\n\n').trim();
}

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

function csvToMarkdown(csv) {
  const rows = csv.trim().split('\n').map(parseCSVLine);
  if (!rows.length) return '';
  const sep = '|' + rows[0].map(() => '---').join('|') + '|';
  return rows.map((r, i) => {
    const row = '|' + r.map(c => c.replace(/\|/g, '\\|')).join('|') + '|';
    return i === 0 ? row + '\n' + sep : row;
  }).join('\n');
}

function csvToHtml(csv, title) {
  const rows = csv.trim().split('\n').map(parseCSVLine);
  if (!rows.length) return '';
  const [headers, ...body] = rows;
  const thead = `<thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  const docTitle = title || 'Test Cases';
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>${esc(docTitle)}</title>\n<style>${CSS}</style>\n</head>\n<body>\n<h1>${esc(docTitle)}</h1>\n<table>${thead}${tbody}</table>\n</body>\n</html>`;
}

function csvToText(csv) {
  const rows = csv.trim().split('\n').map(parseCSVLine);
  if (!rows.length) return csv;
  const widths = rows[0].map((_, ci) => Math.max(...rows.map(r => (r[ci] || '').length)));
  return rows.map((r, ri) => {
    const row = r.map((c, ci) => String(c).padEnd(widths[ci])).join('  |  ');
    return ri === 0 ? row + '\n' + '─'.repeat(row.length) : row;
  }).join('\n');
}

function convert(content, fromFormat, toFormat, title) {
  if (!content) return content;
  if (fromFormat === toFormat) return content;
  // Binary/complex formats not supported server-side — fall back to closest text equivalent
  // docx → render as html so it's readable; pdf → html; xlsx → csv source or markdown
  if (toFormat === 'docx' || toFormat === 'pdf') {
    return fromFormat === 'csv' ? csvToHtml(content, title) : mdToHtml(content, title);
  }
  if (toFormat === 'xlsx') {
    return fromFormat === 'csv' ? content : content; // keep csv as-is; xlsx export needs a library
  }
  if (toFormat === 'json') return content; // raw content; LLM JSON is already in artifact.json
  if (fromFormat === 'csv') {
    if (toFormat === 'html')     return csvToHtml(content, title);
    if (toFormat === 'markdown') return csvToMarkdown(content);
    if (toFormat === 'txt')      return csvToText(content);
  }
  if (toFormat === 'html') return mdToHtml(content, title);
  if (toFormat === 'txt')  return mdToText(content);
  return content;
}

module.exports = { convert, ext, resolveFormat, mdToHtml, mdToText, csvToMarkdown, csvToHtml, csvToText };
