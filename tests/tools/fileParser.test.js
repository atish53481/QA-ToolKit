// tests/tools/fileParser.test.js
const { parseFile } = require('../../tools/fileParser');

describe('parseFile', () => {
  it('throws on unsupported extension', async () => {
    await expect(parseFile(Buffer.from('x'), 'text/plain', 'file.txt')).rejects.toThrow('Unsupported file type: txt');
  });

  it('parses XLSX buffer to CSV text', async () => {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Name','Age'],['Alice',30]]), 'S1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const text = await parseFile(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'data.xlsx');
    expect(text).toContain('Alice');
  });
});
