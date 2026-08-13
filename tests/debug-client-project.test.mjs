import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setupControlCenter, validateControlCenter } from '../tools/troubleshooting-folder/src/control-center.mjs';
import { guidedQuestions, investigate } from '../tools/debug-client-project/src/investigate.mjs';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const fixture = (name) => path.join(repoRoot, 'tests/fixtures/saved-projects', name);
async function control() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'workwonders-phase3-'));
  await setupControlCenter({ mode: 'fake', outputDir: root, clientName: 'Fictional Harbor Co', project: { id: 'PROJECT-FAKE-001', name: 'Fictional Margin Helper', savedCopyLocation: 'project-backups/fake.json' } });
  return root;
}
async function run(name, extra = {}) {
  const root = await control();
  const result = await investigate({ controlCenterDir: root, savedCopyPath: fixture(name), clientName: 'Fictional Harbor Co', project: { id: 'PROJECT-FAKE-001', name: 'Fictional Margin Helper', savedCopyLocation: 'project-backups/fake.json' }, complaint: 'The expected margin answer is different from the result.', issueId: 'ISSUE-FAKE-100', mode: 'fake', clientOwner: 'Fictional finance owner', ...extra });
  return { root, result };
}

test('guided flow asks one choice question at a time and uses plain language', () => {
  assert.equal(guidedQuestions().length, 3);
  assert.match(guidedQuestions()[0], /Which client and project/);
  assert.match(guidedQuestions()[1], /What did you expect/);
});

test('client complaint and proven project-rule cause create one complete issue and card', async () => {
  const { root, result } = await run('client-complaint-rule.json');
  try {
    assert.equal(result.plan.rootCause.category, 'project rule');
    assert.equal((await readdir(path.join(root, 'issues'))).length, 2);
    assert.deepEqual(await validateControlCenter(root), []);
    const card = await readFile((await readdir(path.join(root, 'issues'))).map((f) => path.join(root, 'issues', f)).find((f) => f.includes('CARD-ISSUE-FAKE-100')), 'utf8');
    assert.match(card, /Evidence that would prove/);
    assert.match(card, /Evidence that would disprove/);
    assert.match(card, /The saved instruction says/);
    assert.match(card, /Lilly approval is required/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('proven data cause writes named-owner data report with correction and recheck', async () => {
  const { root, result } = await run('data-cause.json');
  try {
    assert.equal(result.dataReport.owner, 'Fictional finance owner');
    assert.match(result.dataReport.correction, /Add the approved/);
    assert.match(result.dataReport.recheck, /Re-run/);
    assert.deepEqual(await validateControlCenter(root), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('missing business decision stops with a named decision owner', async () => {
  const { root, result } = await run('missing-decision.json');
  try { assert.equal(result.card.status, 'blocked'); assert.equal(result.summary.nextOwner, 'Client decision owner'); assert.match(result.summary.nextAction, /official rule or source/); } finally { await rm(root, { recursive: true, force: true }); }
});

test('unresolved investigation writes developer ticket with full evidence packet', async () => {
  const { root, result } = await run('unresolved-originals.json');
  try { assert.ok(result.developerTicket); assert.match(result.developerTicket.attemptedTests, /A project rule/); assert.match(result.developerTicket.evidence, /CARD-ISSUE-FAKE-100/); assert.match(result.developerTicket.ruledOutCauses, /A project rule/); assert.deepEqual(await validateControlCenter(root), []); } finally { await rm(root, { recursive: true, force: true }); }
});

test('deep check allows at most two evidence-led new causes and then escalates', async () => {
  const { root, result } = await run('unresolved-new-causes.json');
  try { assert.equal(result.plan.newCauses, 2); assert.equal(result.plan.attempts.length, 5); assert.match(result.plan.stopReason, /two evidence-led/); assert.ok(result.developerTicket); } finally { await rm(root, { recursive: true, force: true }); }
});

test('rerun reuses exactly one issue and card, and no live action is available', async () => {
  const root = await control();
  const input = { controlCenterDir: root, savedCopyPath: fixture('client-complaint-rule.json'), clientName: 'Fictional Harbor Co', project: { id: 'PROJECT-FAKE-001', name: 'Fictional Margin Helper', savedCopyLocation: 'project-backups/fake.json' }, complaint: 'The expected margin answer is different from the result.', issueId: 'ISSUE-FAKE-101', mode: 'fake' };
  try { const first = await investigate(input); const second = await investigate(input); assert.equal(second.result.created.length, 0); const issueFiles = (await readdir(path.join(root, 'issues'))).filter((f) => f.includes('ISSUE-FAKE-101') && !f.includes('CARD-')); assert.equal(issueFiles.length, 1); assert.equal(typeof first.liveAction, 'undefined'); } finally { await rm(root, { recursive: true, force: true }); }
});

test('does not claim passed when required evidence is not available', async () => {
  const { root, result } = await run('unresolved-originals.json');
  try { assert.notEqual(result.card.status, 'passed'); assert.match(result.card.currentAnswer, /Not known/); } finally { await rm(root, { recursive: true, force: true }); }
});
