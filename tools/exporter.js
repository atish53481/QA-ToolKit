const archiver = require('archiver');

async function buildZip(artifacts) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('data', c => chunks.push(c));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    if (artifacts.testStrategy?.markdown) archive.append(artifacts.testStrategy.markdown, { name: 'Test Strategy.md' });
    if (artifacts.testPlan?.markdown) archive.append(artifacts.testPlan.markdown, { name: 'Test Plan.md' });
    if (artifacts.testCases?.csv) archive.append(artifacts.testCases.csv, { name: 'Test Cases.csv' });
    if (artifacts.bugReport?.markdown) archive.append(artifacts.bugReport.markdown, { name: 'Bug Report.md' });
    archive.finalize();
  });
}

module.exports = { buildZip };
