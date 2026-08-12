import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createDryRun, loadTemplateDefinitions, validateRecord, validateRecordCollection } from '../tools/troubleshooting-foundation/src/records.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const templateDir = path.join(repoRoot, 'templates/troubleshooting');
const fixturePath = path.join(repoRoot, 'tests/fixtures/troubleshooting-fake-records.json');

test('all ten named reusable templates declare required fields', async () => {
  const definitions = await loadTemplateDefinitions(templateDir);
  assert.equal(definitions.length, 10);
  assert.deepEqual(definitions.map(({ type }) => type), [
    'Data Integrity Report', 'Developer Ticket', 'Health Report', 'Issue & Fix Log',
    'Project Register', 'Release Record', 'Start Here', 'Test Library',
    'Troubleshooting Card', 'Trusted Sources',
  ]);
  for (const definition of definitions) {
    assert.ok(definition.requiredFields.length > 0, definition.type);
    if (definition.text.includes('passed')) {
      for (const field of ['check_method', 'evidence_reference', 'checked_by', 'checked_on']) {
        assert.ok(definition.requiredFields.includes(field), `${definition.type} must require ${field} when it permits passed.`);
      }
    }
  }
});

test('the plugin discovers the debug-client-project skill through its normal skills directory', async () => {
  const manifest = JSON.parse(await readFile(path.join(repoRoot, '.claude-plugin/plugin.json'), 'utf8'));
  const skill = await readFile(path.join(repoRoot, 'skills/debug-client-project/SKILL.md'), 'utf8');
  assert.equal(manifest.skills, './skills/');
  assert.match(skill, /^name: debug-client-project$/m);
});

test('the fake-data dry run creates every named blank record', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'workwonders-troubleshooting-'));
  try {
    const created = await createDryRun({ templateDir, fixturePath, outputDir });
    assert.equal(created.length, 10);
    for (const file of created) {
      const content = await readFile(file, 'utf8');
      assert.match(content, /FICTIONAL LOCAL TEST DATA — NOT CLIENT MATERIAL/);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('the dry run refuses to write inside the repository', async () => {
  await assert.rejects(
    createDryRun({ templateDir, fixturePath, outputDir: path.join(repoRoot, 'dry-run-output'), repoRoot }),
    /outside the repository/,
  );
});

test('a record missing a required field is rejected', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Issue & Fix Log');
  const errors = validateRecord({ issue_id: 'ISSUE-FAKE' }, definition);
  assert.ok(errors.some((error) => error.includes('symptoms')));
});

test('an uncheckable passed item is rejected', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Troubleshooting Card');
  const record = { card_id: 'CARD-FAKE', question: 'Is it checked?', current_answer: 'Maybe', check_method: '', evidence_reference: '', status: 'passed', checked_by: '', checked_on: '', next_owner: 'Example reviewer', next_action: 'Check it.' };
  const errors = validateRecord(record, definition);
  assert.ok(errors.some((error) => error.includes('checkable check_method')));
  assert.ok(errors.some((error) => error.includes('checkable evidence_reference')));
  assert.ok(errors.some((error) => error.includes('checkable checked_by')));
  assert.ok(errors.some((error) => error.includes('checkable checked_on')));
});

test('duplicate record IDs are rejected', async () => {
  const definitions = await loadTemplateDefinitions(templateDir);
  const errors = validateRecordCollection([
    { record_type: 'Project Register', project_id: 'DUPLICATE', project_label: 'A', claude_account: 'A', source_list: 'SRC', saved_copy_location: '/tmp/a', project_purpose: 'A', status: 'active', owner: 'A', trusted_source_reference: 'SRC' },
    { record_type: 'Project Register', project_id: 'DUPLICATE', project_label: 'B', claude_account: 'B', source_list: 'SRC', saved_copy_location: '/tmp/b', project_purpose: 'B', status: 'active', owner: 'B', trusted_source_reference: 'SRC' },
  ], definitions);
  assert.ok(errors.some((error) => error.includes('Duplicate record ID: DUPLICATE')));
});

test('invalid status is rejected', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Issue & Fix Log');
  const record = { issue_id: 'ISSUE-FAKE', symptoms: 'A fictional issue.', proven_root_cause: 'Not yet proven.', solution: 'Investigate.', permanent_check: 'Run a fake test.', resolution_date: 'not resolved', evidence_reference: 'TEST-FAKE', impact: 'Training only', owner: 'Example reviewer', status: 'maybe' };
  assert.ok(validateRecord(record, definition).some((error) => error.includes('Invalid status: maybe')));
});

test('a Release Record needs a rollback action', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Release Record');
  const record = { release_id: 'REL-FAKE', target_project_id: 'PROJECT-FAKE', change_summary: 'Fictional change.', approved_file_list: 'fake.md', included_records: 'ISSUE-FAKE', verification_status: 'not_checked', check_method: 'Not run.', checked_by: 'Example reviewer', checked_on: '2026-08-12', evidence_reference: 'Not available.', post_update_comparison_result: 'not run', client_email_required: 'no', approver: 'Example reviewer', release_date: '2026-08-12', rollback_action: '' };
  assert.ok(validateRecord(record, definition).some((error) => error.includes('rollback_action')));
});

test('a Project Register needs a unique project ID', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Project Register');
  const record = { project_label: 'Example', claude_account: 'Example account', source_list: 'SRC-FAKE', saved_copy_location: '/fictional/copy', project_purpose: 'Training only', status: 'active', owner: 'Example reviewer', trusted_source_reference: 'SRC-FAKE' };
  assert.ok(validateRecord(record, definition).some((error) => error.includes('project_id')));
});

test('a Test Library item needs an expected result and owner', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Test Library');
  const record = { test_id: 'TEST-FAKE', purpose: 'Training only', setup: 'Fictional local data', steps: 'Read it.', expected_result: '', check_method: 'Read it.', refresh_date: '2026-08-12', scope: 'shared', owner: '' };
  const errors = validateRecord(record, definition);
  assert.ok(errors.some((error) => error.includes('expected_result')));
  assert.ok(errors.some((error) => error.includes('owner')));
});
