import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createDryRun, loadTemplateDefinitions, validateRecord } from '../tools/troubleshooting-foundation/src/records.mjs';

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
      assert.match(content, /Fake local test data/);
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('a record missing a required field is rejected', async () => {
  const [definition] = (await loadTemplateDefinitions(templateDir)).filter(({ type }) => type === 'Issue & Fix Log');
  const errors = validateRecord({ issue_id: 'ISSUE-FAKE' }, definition);
  assert.ok(errors.some((error) => error.includes('observed_problem')));
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
