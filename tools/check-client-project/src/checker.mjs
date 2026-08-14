import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { setupControlCenter, writeHealthReport } from '../../troubleshooting-folder/src/control-center.mjs';
import { investigate } from '../../debug-client-project/src/investigate.mjs';

const today = () => new Date().toISOString().slice(0, 10);
const clean = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

export async function loadTestLibrary(file) {
  const data = JSON.parse(await readFile(file, 'utf8'));
  const tests = Array.isArray(data) ? data : data.tests || data.test_library;
  if (!Array.isArray(tests) || !tests.length) throw new Error('The Test Library must contain at least one test.');
  for (const test of tests) {
    for (const field of ['test_id', 'purpose', 'setup', 'steps', 'expected_result', 'check_method', 'refresh_date', 'scope', 'owner']) if (!test[field]) throw new Error(`Test Library item is missing ${field}.`);
  }
  for (const test of tests) if (!['shared', 'client-specific'].includes(test.scope)) throw new Error(`Test Library item ${test.test_id} has invalid scope: ${test.scope}.`);
  return tests;
}

export async function loadSavedCopy(file) {
  const saved = JSON.parse(await readFile(file, 'utf8'));
  if (!saved.project_id || !Array.isArray(saved.checks)) throw new Error('The saved copy must name a project and list its checks.');
  return saved;
}

function resultFor(test, saved) {
  const supplied = saved.test_results?.[test.test_id] ?? saved.results?.[test.test_id];
  if (supplied) return typeof supplied === 'string' ? { status: supplied, evidence: 'Result supplied by the saved-copy fixture.' } : supplied;
  const check = saved.checks.find((item) => item.test_id === test.test_id);
  if (check) return { status: check.result === 'passed' || check.result === 'healthy' ? 'passed' : 'failed', evidence: check.evidence || 'Fixture check result.' };
  return { status: 'failed', evidence: 'The saved copy did not contain a result for this required test.' };
}

export async function runClientProjectCheck({ controlCenterDir, savedCopyPath, testLibraryPath, clientName, project, mode = 'fake', clientOwner = 'named client owner', operator = 'Lilly', date = today(), repoRoot }) {
  if (mode !== 'fake') throw new Error('This checker only runs saved-copy fixtures in Phase 4.');
  const saved = await loadSavedCopy(savedCopyPath);
  if (saved.project_id !== project.id) throw new Error(`Saved copy project ${saved.project_id} does not match ${project.id}.`);
  const tests = await loadTestLibrary(testLibraryPath);
  const results = tests.map((test) => ({ testId: test.test_id, purpose: test.purpose, ...resultFor(test, saved) }));
  const failed = results.filter((result) => result.status !== 'passed');
  await setupControlCenter({ outputDir: controlCenterDir, clientName, project, mode, repoRoot });
  const reportId = `HEALTH-${project.id}-${date}`;
  if (!failed.length) {
    const healthReport = { reportId, date, title: `${clientName} ${project.name} Health Report`, scope: 'All active Test Library checks for this saved project copy', overallStatus: 'healthy', known: `${results.length} required checks passed.`, unknown: 'The live Claude Project, Basecamp, Drive, cloud runner, and email were not checked.', nextOwner: operator, nextAction: 'Review the short Health Report on the next workday.', checkMethod: 'Run every Test Library item against the saved-copy fixture.', evidenceReference: path.basename(savedCopyPath), checkedBy: operator, checkedOn: date };
    const result = await writeHealthReport({ outputDir: controlCenterDir, project, report: healthReport, mode, repoRoot });
    return { status: 'healthy', results, failed, healthReport: result, deepCheck: null };
  }
  const first = failed[0];
  const deepSaved = { ...saved, likely_causes: saved.likely_causes || [{ id: 'test-failure', label: first.purpose, category: 'project rule' }], checks: saved.deep_checks || saved.checks };
  const deepCheck = await investigate({ controlCenterDir, project, clientName, complaint: `Routine check failed: ${first.purpose}`, savedCopyPath, issueId: `DEEP-${project.id}-${date}`, operator, clientOwner, date, mode, repoRoot });
  return { status: 'needs review', results, failed, healthReport: deepCheck.healthReport, deepCheck };
}
