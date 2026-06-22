// tests/tools/exporter.test.js
const { buildZip } = require('../../tools/exporter');

describe('buildZip', () => {
  it('returns a Buffer with ZIP magic bytes', async () => {
    const buf = await buildZip({ testStrategy: { markdown: '# Strategy' }, testCases: { csv: 'Scenario,TID' } });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it('returns valid zip for empty artifacts', async () => {
    const buf = await buildZip({});
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
