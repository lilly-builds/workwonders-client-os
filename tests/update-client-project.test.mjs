import test from 'node:test';
import assert from 'node:assert/strict';
import { behaviorContract, evaluateBehavior } from '../tools/update-client-project/src/behavior.mjs';
import { assertPacketComplete } from '../tools/update-client-project/src/packet.mjs';
import { assertCandidateLink, assertStagingTitle, assertNoDuplicateFiles, assertAccountSkillsChecked, assertBehaviorResult, assertExactTarget, assertFreshComparison, assertRequiredComponents } from '../tools/update-client-project/src/guards.mjs';
import { previewUpdate, runControlledUpdate } from '../tools/update-client-project/src/update.mjs';

const live = { uuid: 'live-1', name: 'Owner Intelligence', instructions: 'old', docs: [{ file_name: 'rules.md', content: 'old' }] };
const proposed = { uuid: 'disk', name: 'saved', instructions: 'new', docs: [{ file_name: 'rules.md', content: 'new' }] };
const contract = behaviorContract({ originalProblemQuestion: 'Why is margin wrong?', expectedResults: Object.fromEntries(['Why is margin wrong?', 'Is the answer using the correct source?', 'Does it cover all relevant pages?', 'Does it use the cost code correctly?', 'Does it exclude denied bills?', 'Does it keep cost separate from price?'].map((q) => [q, 'pass'])), allowedTestData: 'sanitized fixture', evidenceLocation: 'test evidence' });
const responses = Object.fromEntries([...contract.safety_questions, contract.original_problem_question].map((q) => [q, { result: 'pass' }]));
responses[contract.open_question] = { reviewed: true, concern: null };

test('preview is visible and writes nothing', async () => {
  let writes = 0;
  const result = await runControlledUpdate({ request: { live_project_id: live.uuid, live, proposed, write: false }, transport: { readProject: async () => live, writeApproved: async () => writes++ } });
  assert.equal(result.status, 'preview-only');
  assert.equal(result.preview.changes.length, 2);
  assert.equal(writes, 0);
});

test('no approval means no write', async () => {
  let writes = 0;
  await assert.rejects(() => runControlledUpdate({ request: { live_project_id: live.uuid, proposed, write: true, named_target: 'target' }, transport: { readProject: async () => live, writeApproved: async () => writes++ } }), /approval/);
  assert.equal(writes, 0);
});

test('wrong ID, duplicate file, unexpected file, and staging guard stop', () => {
  assert.throws(() => previewUpdate({ live, proposed: { ...proposed, docs: [...proposed.docs, { file_name: 'extra.md' }] } }), /file list/);
  assert.throws(() => assertNoDuplicateFiles({ instructions: 'x', docs: [{ file_name: 'a' }, { file_name: 'a' }] }), /duplicate/);
  assert.throws(() => assertStagingTitle('Owner Intelligence'), /must start/);
  assert.throws(() => assertCandidateLink({ uuid: 'candidate', name: 'STAGING — Owner Intelligence', source_live_project_id: 'wrong' }, live.uuid), /not linked/);
  assert.throws(() => assertExactTarget({ uuid: 'other' }, live.uuid), /Wrong/);
  assert.throws(() => assertRequiredComponents({ instructions: 'x', docs: [] }, live), /missing/);
});

test('candidate/live identity and fresh comparison failures stop', () => {
  assert.throws(() => assertCandidateLink({ uuid: live.uuid, name: 'STAGING — Owner Intelligence', source_live_project_id: live.uuid }, live.uuid), /different IDs/);
  assert.throws(() => assertFreshComparison({ fresh: true, matches: false }, 'Candidate'), /did not match/);
});

test('behavior pass and failure, including open-question review', () => {
  assert.equal(evaluateBehavior(contract, responses).status, 'passed');
  assert.equal(evaluateBehavior(contract, { ...responses, 'Does it use the cost code correctly?': { result: 'wrong' } }).status, 'failed');
  assert.equal(evaluateBehavior(contract, { ...responses, [contract.open_question]: { reviewed: false } }).open_question_reviewed, false);
  assert.equal(evaluateBehavior({ ...contract, expected_results: { ...contract.expected_results, 'Does it use the cost code correctly?': undefined } }, responses).status, 'failed');
  assert.equal(evaluateBehavior(contract, { ...responses, [contract.open_question]: { reviewed: true, concern: 'A concern' } }).status, 'failed');
});

test('behavior contract requires expected answers and evidence location', () => {
  assert.throws(() => behaviorContract({ originalProblemQuestion: 'Q', expectedResults: {}, allowedTestData: 'fixture', evidenceLocation: 'evidence' }), /Expected answers/);
  const expected = Object.fromEntries(['Q', ...contract.safety_questions].map((q) => [q, 'pass']));
  assert.throws(() => behaviorContract({ originalProblemQuestion: 'Q', expectedResults: expected, allowedTestData: 'fixture' }), /evidence location/);
});

test('promotion packet completeness is enforced', () => {
  assert.throws(() => assertPacketComplete({}), /incomplete/);
  assert.throws(() => assertPacketComplete({ change_summary: 'x', target_map: { live_project_id: 'l', candidate_project_id: 'c', live_project_name: 'Live', candidate_project_name: 'Stage' }, approved_files: ['rules.md'], candidate_behavior_evidence: { status: 'passed', evidence_location: 'candidate-evidence' }, lilly_review: { reviewer: 'Lilly', decision: 'approved', reviewed_at: 'today' }, promotion_plan: { only_approved_files: true, files: ['rules.md'] }, rollback_action: 'restore', live_proof: { status: 'not-run' }, candidate_owner: 'Lilly', staging_cleanup: { expiry: 'tomorrow', rule: 'archive' }, permanent_check: {} }), /permanent check/);
});

test('account-level Skill gap is a blocker', () => {
  assert.throws(() => assertAccountSkillsChecked({ required: true, candidateChecked: false, liveChecked: true }), /not checked/);
});

test('behavior not-run and open-question review are not passes', () => {
  assert.throws(() => assertBehaviorResult({ status: 'not-run' }, 'Candidate'), /not run/);
  assert.throws(() => assertBehaviorResult({ status: 'passed', open_question_reviewed: false }, 'Candidate'), /human review/);
});

test('candidate approval promotes only approved files and records release', async () => {
  const writes = [];
  const candidate = { uuid: 'candidate-1', name: 'STAGING — Owner Intelligence', source_live_project_id: live.uuid, instructions: 'old', docs: [{ file_name: 'rules.md', content: 'old' }] };
  const changed = { ...candidate, uuid: live.uuid, name: live.name, instructions: 'new', docs: [{ file_name: 'rules.md', content: 'new' }] };
  const changedCandidate = { ...candidate, instructions: 'new', docs: [{ file_name: 'rules.md', content: 'new' }] };
  let readCount = 0;
  let record;
  const transport = {
    canClone: true,
    readProject: async (id) => { if (id === live.uuid) return readCount++ ? changed : live; return readCount++ ? changedCandidate : candidate; },
    cloneProject: async () => candidate,
    writeApproved: async (id, files, changes) => writes.push({ id, changes }),
    compareFresh: async () => ({ fresh: true, matches: true }),
    saveReleaseRecord: async (r) => { record = r; },
  };
  const result = await runControlledUpdate({ request: { live_project_id: live.uuid, proposed, write: true, named_target: 'Owner Intelligence', approval: { reviewer: 'Lilly', decision: 'approved' }, lilly_review: { reviewer: 'Lilly', decision: 'approved', reviewed_at: 'today' }, change_summary: 'fix', rollback_action: 'restore saved copy', permanent_check: { type: 'client Test Library', reference: 'TEST-1' }, candidate_owner: 'Lilly', staging_expiry: 'after promotion', staging_cleanup_rule: 'archive or remove after review', candidate_skills_checked: true, live_skills_checked: true }, transport, behaviorRunner: async () => ({ status: 'passed', open_question_reviewed: true, evidence_location: 'fixture-evidence' }) });
  assert.equal(result.status, 'verified');
  assert.deepEqual(writes.map((w) => w.id), ['candidate-1', 'live-1']);
  assert.equal(record.status, 'verified');
});

test('missing existing file is rejected before any write', () => {
  assert.throws(() => previewUpdate({ live, proposed: { ...proposed, docs: [] } }), /file list/);
});

test('live behavior failure restores the saved version and records failure', async () => {
  const writes = [];
  let saved;
  let restored = false;
  const candidate = { uuid: 'candidate-2', name: 'STAGING — Owner Intelligence', source_live_project_id: live.uuid, instructions: 'old', docs: [{ file_name: 'rules.md', content: 'old' }] };
  const transport = {
    canClone: true,
    readProject: async (id) => id === live.uuid ? live : candidate,
    cloneProject: async () => candidate,
    writeApproved: async (id) => writes.push(id),
    restoreProject: async () => { restored = true; },
    compareFresh: async (_id, expected) => ({ fresh: true, matches: true }),
    saveReleaseRecord: async (record) => { saved = record; },
  };
  await assert.rejects(() => runControlledUpdate({ request: { live_project_id: live.uuid, proposed, write: true, named_target: 'Owner Intelligence', approval: { reviewer: 'Lilly', decision: 'approved' }, lilly_review: { reviewer: 'Lilly', decision: 'approved', reviewed_at: 'today' }, change_summary: 'fix', rollback_action: 'restore saved copy', permanent_check: { type: 'shared Client OS rule', reference: 'RULE-1' }, candidate_owner: 'Lilly', staging_expiry: 'after promotion', staging_cleanup_rule: 'archive', candidate_skills_checked: true, live_skills_checked: true }, transport, behaviorRunner: async (_project, stage) => stage === 'candidate' ? { status: 'passed', open_question_reviewed: true, evidence_location: 'candidate-evidence' } : { status: 'failed', evidence_location: 'live-evidence' } }), /Live verification failed/);
  assert.deepEqual(writes, ['candidate-2', 'live-1']);
  assert.equal(restored, true);
  assert.equal(saved.status, 'failed verification');
  assert.equal(saved.update_packet.live_proof.rollback.succeeded, true);
});

test('rollback failure is recorded and clearly reported', async () => {
  const candidate = { uuid: 'candidate-3', name: 'STAGING — Owner Intelligence', source_live_project_id: live.uuid, instructions: 'old', docs: [{ file_name: 'rules.md', content: 'old' }] };
  const transport = {
    canClone: true,
    readProject: async (id) => id === live.uuid ? live : candidate,
    cloneProject: async () => candidate,
    writeApproved: async () => {},
    restoreProject: async () => { throw new Error('restore unavailable'); },
    compareFresh: async () => ({ fresh: true, matches: true }),
    saveReleaseRecord: async () => {},
  };
  await assert.rejects(() => runControlledUpdate({ request: { live_project_id: live.uuid, proposed, write: true, named_target: 'Owner Intelligence', approval: { reviewer: 'Lilly', decision: 'approved' }, lilly_review: { reviewer: 'Lilly', decision: 'approved', reviewed_at: 'today' }, change_summary: 'fix', rollback_action: 'restore saved copy', permanent_check: { type: 'client Test Library', reference: 'TEST-2' }, candidate_owner: 'Lilly', staging_expiry: 'after promotion', staging_cleanup_rule: 'archive', candidate_skills_checked: true, live_skills_checked: true }, transport, behaviorRunner: async (_project, stage) => stage === 'candidate' ? { status: 'passed', open_question_reviewed: true, evidence_location: 'candidate-evidence' } : { status: 'failed', evidence_location: 'live-evidence' } }), /Rollback also failed/);
});

test('one front door, one writer, and the writer still works', async () => {
  // The earlier version of this test asserted that update-claude-project was a
  // redirect stub AND that it did NOT contain `node src/push.mjs`. That locked
  // the only working write path out of the repo: the front door delegated to a
  // skill that had been emptied, so nothing in the update flow could reach
  // Claude. The contract below is what was actually intended.
  const { readFile } = await import('node:fs/promises');
  const frontDoor = await readFile(new URL('../skills/update-client-project/SKILL.md', import.meta.url), 'utf8');
  const writer = await readFile(new URL('../skills/update-claude-project/SKILL.md', import.meta.url), 'utf8');

  // The front door decides whether a client change may happen, and names its writer.
  assert.match(frontDoor, /update-client-project/);
  assert.match(frontDoor, /update-claude-project/);

  // The writer holds the mechanics, and they must not be hollowed out again.
  assert.match(writer, /node src\/push\.mjs/);
  assert.match(writer, /--dry-run/);

  // Exactly one writer: the front door must not grow its own push command.
  assert.doesNotMatch(frontDoor, /node src\/push\.mjs/);

  // Neither file may point at the other as its only content.
  assert.doesNotMatch(writer, /redirect-only/);
});
