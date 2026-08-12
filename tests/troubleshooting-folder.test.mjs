import assert from 'node:assert/strict';
import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CORE_DIRECTORIES, CORE_FILES, setupControlCenter, validateControlCenter } from '../tools/troubleshooting-folder/src/control-center.mjs';

const fake = { clientName: 'Fictional Harbor Co', project: { id: 'PROJECT-FAKE-001', name: 'Fictional Margin Helper', savedCopyLocation: 'project-backups/Fictional Margin Helper/' } };
async function temp() { return mkdtemp(path.join(os.tmpdir(), 'workwonders-control-center-')); }

test('first setup creates the agreed layout and linked fake records', async () => {
  const root = await temp();
  try {
    const result = await setupControlCenter({ outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-001', title: 'Margin total differs', projectId: fake.project.id, date: '2026-08-12', reportFiles: ['2026-08-12 Health Report.md'] }], reports: [{ title: 'Morning check', reportId: 'REPORT-FAKE-001', date: '2026-08-12' }] });
    assert.equal(result.created.length, 7);
    for (const file of CORE_FILES) await readFile(path.join(root, file));
    for (const directory of CORE_DIRECTORIES) assert.ok((await lstat(path.join(root, directory))).isDirectory());
    const issue = await readFile(path.join(root, 'issues', (await readdir(path.join(root, 'issues')))[0]), 'utf8');
    assert.match(issue, /01%20Project%20Register\.md/);
    assert.match(issue, /reports\/2026-08-12%20Health%20Report\.md/);
    assert.match(issue, /project-backups/);
    assert.deepEqual(await validateControlCenter(root), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('repeat setup reuses records and creates no duplicate editable copies', async () => {
  const root = await temp();
  try {
    const input = { outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-001', title: 'Margin total differs', projectId: fake.project.id }] };
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
    await setupControlCenter({ outputDir: root, ...fake, issues: [{ issueId: 'ISSUE-FAKE-001', title: 'One', projectId: fake.project.id }] });
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
    await assert.rejects(setupControlCenter({ outputDir: 'relative-folder', ...fake }), /absolute path/);
    await assert.rejects(setupControlCenter({ outputDir: path.join(repo, 'inside'), repoRoot: repo, ...fake }), /outside the repository/);
    await assert.rejects(setupControlCenter({ outputDir: path.parse(root).root, ...fake }), /filesystem root/);
    await assert.rejects(setupControlCenter({ outputDir: file, ...fake }), /folder, not a file/);
  } finally { await rm(root, { recursive: true, force: true }); await rm(repo, { recursive: true, force: true }); }
});
