import assert from 'node:assert/strict';
import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CORE_DIRECTORIES, CORE_FILES, setupControlCenter, validateControlCenter } from '../tools/troubleshooting-folder/src/control-center.mjs';
import { loadTemplateDefinitions, validateRecordCollection } from '../tools/troubleshooting-foundation/src/records.mjs';

const fake = { clientName: 'Fictional Harbor Co', project: { id: 'PROJECT-FAKE-001', name: 'Fictional Margin Helper', savedCopyLocation: 'project-backups/Fictional Margin Helper/' } };
async function temp() { return mkdtemp(path.join(os.tmpdir(), 'workwonders-control-center-')); }
function frontMatterRecord(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/m)?.[1];
  return Object.fromEntries((block || '').split('\n').map((line) => line.match(/^([^:]+):\s*(.*)$/)).filter(Boolean).map(([, key, value]) => [key.trim(), value.trim()]));
}

test('first setup creates the agreed layout and linked fake records', async () => {
  const root = await temp();
  try {
    const result = await setupControlCenter({ mode: 'fake', outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-001', title: 'Margin total differs', projectId: fake.project.id, date: '2026-08-12', reportFiles: ['2026-08-12 Health Report.md'] }], reports: [{ title: 'Morning check', reportId: 'REPORT-FAKE-001', date: '2026-08-12' }], releases: [{ title: 'Initial release', releaseId: 'RELEASE-FAKE-001', date: '2026-08-12' }] });
    assert.equal(result.created.length, 8);
    for (const file of CORE_FILES) await readFile(path.join(root, file));
    for (const directory of CORE_DIRECTORIES) assert.ok((await lstat(path.join(root, directory))).isDirectory());
    const issue = await readFile(path.join(root, 'issues', (await readdir(path.join(root, 'issues')))[0]), 'utf8');
    assert.match(issue, /01%20Project%20Register\.md/);
    assert.match(issue, /reports\/2026-08-12%20Health%20Report\.md/);
    assert.match(issue, /project-backups/);
    assert.deepEqual(await validateControlCenter(root), []);
    const definitions = await loadTemplateDefinitions(path.join(path.dirname(new URL(import.meta.url).pathname), '../templates/troubleshooting'));
    const records = [];
    for (const file of [path.join(root, '01 Project Register.md'), path.join(root, 'issues', (await readdir(path.join(root, 'issues')))[0]), path.join(root, 'reports', (await readdir(path.join(root, 'reports')))[0]), path.join(root, 'releases', (await readdir(path.join(root, 'releases')))[0])]) records.push(frontMatterRecord(await readFile(file, 'utf8')));
    assert.deepEqual(validateRecordCollection(records, definitions), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('repeat setup reuses records and creates no duplicate editable copies', async () => {
  const root = await temp();
  try {
    const input = { mode: 'fake', outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-001', title: 'Margin total differs', projectId: fake.project.id }] };
    const first = await setupControlCenter(input);
    const second = await setupControlCenter(input);
    assert.equal(second.created.length, 0);
    assert.equal(second.reused.length, first.created.length);
    assert.equal((await readdir(path.join(root, 'issues'))).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('validation catches missing core files, unknown projects, and duplicate issue IDs', async () => {
  const root = await temp();
  try {
    await setupControlCenter({ mode: 'fake', outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-001', title: 'One', projectId: fake.project.id }] });
    await rm(path.join(root, '00 Start Here.md'));
    await writeFile(path.join(root, 'issues', 'bad.md'), '---\nissue_id: ISSUE-FAKE-001\nproject_id: PROJECT-UNKNOWN\n---\n');
    const errors = await validateControlCenter(root);
    assert.ok(errors.some((error) => error.includes('Missing core file: 00 Start Here.md')));
    assert.ok(errors.some((error) => error.includes('Duplicate issue ID: ISSUE-FAKE-001')));
    assert.ok(errors.some((error) => error.includes('Unknown project reference: PROJECT-UNKNOWN')));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('path safety rejects relative paths, repository paths, roots, and files', async () => {
  const root = await temp();
  const repo = await temp();
  const file = path.join(root, 'not-a-folder');
  await writeFile(file, 'not a folder');
  try {
    await assert.rejects(setupControlCenter({ mode: 'fake', outputDir: 'relative-folder', ...fake }), /absolute path/);
    await assert.rejects(setupControlCenter({ mode: 'fake', outputDir: path.join(repo, 'inside'), repoRoot: repo, ...fake }), /outside the repository/);
    await assert.rejects(setupControlCenter({ mode: 'fake', outputDir: path.parse(root).root, ...fake }), /filesystem root/);
    await assert.rejects(setupControlCenter({ mode: 'fake', outputDir: file, ...fake }), /folder, not a file/);
  } finally { await rm(root, { recursive: true, force: true }); await rm(repo, { recursive: true, force: true }); }
});

test('same issue ID with a changed title or date is a conflict, not a second record', async () => {
  const root = await temp();
  try {
    const base = { mode: 'fake', outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-002', title: 'Original symptom', projectId: fake.project.id, date: '2026-08-12' }] };
    await setupControlCenter(base);
    await assert.rejects(setupControlCenter({ ...base, issues: [{ ...base.issues[0], title: 'Renamed symptom' }] }), /existing Issue & Fix Log ISSUE-FAKE-002 differs/);
    await assert.rejects(setupControlCenter({ ...base, issues: [{ ...base.issues[0], date: '2026-08-13' }] }), /existing Issue & Fix Log ISSUE-FAKE-002 (differs|has a different record name)/);
    assert.equal((await readdir(path.join(root, 'issues'))).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('validation catches duplicate project, report, and release IDs', async () => {
  const root = await temp();
  try {
    await setupControlCenter({ mode: 'fake', outputDir: root, ...fake, reports: [{ title: 'First report', reportId: 'REPORT-FAKE-002', date: '2026-08-12' }], releases: [{ title: 'First release', releaseId: 'RELEASE-FAKE-002', date: '2026-08-12' }] });
    await writeFile(path.join(root, '01 Project Register.md'), '---\nrecord_type: Project\nproject_id: PROJECT-FAKE-001\n---\n---\nrecord_type: Project\nproject_id: PROJECT-FAKE-001\n---\n');
    await writeFile(path.join(root, 'reports', 'duplicate-report.md'), '---\nrecord_type: Health Report\nreport_id: REPORT-FAKE-002\nproject_id: PROJECT-FAKE-001\n---\n');
    await writeFile(path.join(root, 'releases', 'duplicate-release.md'), '---\nrecord_type: Release Record\nrelease_id: RELEASE-FAKE-002\ntarget_project_id: PROJECT-FAKE-001\n---\n');
    const errors = await validateControlCenter(root);
    assert.ok(errors.some((error) => error.includes('Duplicate project ID: PROJECT-FAKE-001')));
    assert.ok(errors.some((error) => error.includes('Duplicate Health Report ID: REPORT-FAKE-002')));
    assert.ok(errors.some((error) => error.includes('Duplicate Release Record ID: RELEASE-FAKE-002')));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('setup stops on a changed or malformed existing record', async () => {
  const root = await temp();
  try {
    const input = { mode: 'fake', outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-003', title: 'Known symptom', projectId: fake.project.id, date: '2026-08-12' }] };
    await setupControlCenter(input);
    const issueFile = path.join(root, 'issues', (await readdir(path.join(root, 'issues')))[0]);
    await writeFile(issueFile, 'this is not a valid issue record');
    await assert.rejects(setupControlCenter(input), /Control Center conflict: Malformed Issue & Fix Log record/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('fake and approved modes have distinct labels and saved-copy pointers are not claims of backup verification', async () => {
  const fakeRoot = await temp();
  const approvedRoot = await temp();
  try {
    await setupControlCenter({ mode: 'fake', outputDir: fakeRoot, ...fake });
    await setupControlCenter({ mode: 'approved', outputDir: approvedRoot, ...fake });
    const fakeStart = await readFile(path.join(fakeRoot, '00 Start Here.md'), 'utf8');
    const approvedStart = await readFile(path.join(approvedRoot, '00 Start Here.md'), 'utf8');
    const approvedRegister = await readFile(path.join(approvedRoot, '01 Project Register.md'), 'utf8');
    assert.match(fakeStart, /FICTIONAL LOCAL TEST DATA/);
    assert.doesNotMatch(approvedStart, /FICTIONAL LOCAL TEST DATA/);
    assert.match(approvedRegister, /not verified|does not find, copy, read, or verify/i);
  } finally { await rm(fakeRoot, { recursive: true, force: true }); await rm(approvedRoot, { recursive: true, force: true }); }
});
