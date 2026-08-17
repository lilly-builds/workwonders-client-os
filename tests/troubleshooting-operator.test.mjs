import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { intakeTicket, nextOperatorMove, oneQuestionOnly } from '../tools/troubleshooting-operator/src/flow.mjs';
import { assessConnectorReadiness } from '../tools/troubleshooting-operator/src/connector-readiness.mjs';
import { createRequirementChecklist, recordRequirementResult, scoreRequirements } from '../tools/troubleshooting-operator/src/requirements.mjs';
import { checkStagingRouting, compareProjectManifests, createProjectManifest, stagingRoutingLine } from '../tools/troubleshooting-operator/src/staging.mjs';
import { createReviewPacket } from '../tools/troubleshooting-operator/src/review-packet.mjs';

const run = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readyTicket = intakeTicket({ card_body: '', comments: [{ id: 'C-1', body: 'Old request' }, { id: 'C-2', body: 'Please fix the margin answer.' }] });
const readyConnector = assessConnectorReadiness({ requested: [{ name: 'Xcelerate', expected_tenant: 'Patriot' }], connectors: [{ name: 'Xcelerate', status: 'ready', tenant: 'Patriot' }] });
const readyChecklist = () => {
  let checklist = createRequirementChecklist([{ id: 'R-1', text: 'Use the correct cost code.' }]);
  checklist = recordRequirementResult(checklist, { id: 'R-1', status: 'passed', evidence: 'sanitized response', source: 'Xcelerate', attempt: 1 });
  return checklist;
};
const routing = ({ title = 'Margin Helper', instructions } = {}) => checkStagingRouting({ live_title: title, staging_skill_title: 'Margin Helper — STAGING', candidate: { name: `STAGING — ${title}`, instructions: instructions ?? `Copied live instructions\n${stagingRoutingLine('Margin Helper — STAGING')}` } });

test('intake reads both card body and comments, using the most recent useful comment when the body is empty', () => {
  assert.equal(readyTicket.status, 'ready');
  assert.equal(readyTicket.request_text, 'Please fix the margin answer.');
  assert.deepEqual(readyTicket.sources_read, ['comment C-1', 'comment C-2']);
});

test('operator starts with a useful next move and asks exactly one question only when blocked', () => {
  const missingRequest = nextOperatorMove({ ticket: intakeTicket({}) });
  assert.equal(missingRequest.action, 'read the request');
  assert.match(missingRequest.message, /^I’m starting/);
  assert.equal(oneQuestionOnly(missingRequest), true);

  const missingEvidence = nextOperatorMove({ ticket: readyTicket, connector_readiness: readyConnector });
  assert.equal(missingEvidence.action, 'find the evidence home');
  assert.equal(oneQuestionOnly(missingEvidence), true);

  const ready = nextOperatorMove({ ticket: readyTicket, evidence_home: 'Drive/Pilot', connector_readiness: readyConnector });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.question, null);
});

test('connector readiness checks only ticket-named connectors and blocks wrong tenants without pretending results are trustworthy', () => {
  const result = assessConnectorReadiness({
    requested: [{ name: 'Xcelerate', expected_tenant: 'Patriot' }],
    connectors: [
      { name: 'Xcelerate', status: 'ready', tenant: 'Shared demo' },
      { name: 'Unrelated connector', status: 'ready', tenant: 'Wrong tenant' },
    ],
  });
  assert.equal(result.status, 'blocked');
  assert.match(result.plain_summary, /not Patriot/);
  assert.doesNotMatch(result.plain_summary, /Unrelated/);
  const move = nextOperatorMove({ ticket: readyTicket, evidence_home: 'Drive/Pilot', connector_readiness: result });
  assert.equal(move.action, 'check the named connector');
  assert.equal(oneQuestionOnly(move), true);
});

test('requirement checker requires evidence, labels incomplete work honestly, and stops after two attempts', () => {
  let checklist = createRequirementChecklist([{ id: 'R-1', text: 'Use the correct cost code.' }, { id: 'R-2', text: 'Name the source.' }]);
  assert.throws(() => recordRequirementResult(checklist, { id: 'R-1', status: 'passed' }), /evidence and a named source/);
  checklist = recordRequirementResult(checklist, { id: 'R-1', status: 'passed', evidence: 'response', source: 'Xcelerate', attempt: 1 });
  checklist = recordRequirementResult(checklist, { id: 'R-2', status: 'partly working', evidence: 'The connector error appeared as an action.', source: 'project output', attempt: 2 });
  assert.equal(scoreRequirements(checklist).overall_status, 'partly working');
  assert.throws(() => recordRequirementResult(checklist, { id: 'R-2', status: 'failed', evidence: 'third try', source: 'project output', attempt: 3 }), /Stop after two/);
  const stop = nextOperatorMove({ ticket: readyTicket, evidence_home: 'Drive/Pilot', connector_readiness: readyConnector, failed_attempts: 2 });
  assert.equal(stop.action, 'stop repeated attempts');
});

test('staging manifest finds actual drift while allowing only the explicit staging routing line', () => {
  const live = { id: 'LIVE-1', name: 'Margin Helper', instructions: 'Five files are listed.', files: [{ name: 'rules.md', content: 'rules' }, { name: 'encircle.md', content: 'real sixth file' }] };
  const staging = { id: 'STAGE-1', name: 'STAGING — Margin Helper', instructions: `Five files are listed.\n${stagingRoutingLine('Margin Helper — STAGING')}`, files: [{ name: 'rules.md', content: 'rules' }, { name: 'encircle.md', content: 'real sixth file' }] };
  const baseline = createProjectManifest(live);
  const candidate = createProjectManifest(staging, { ignore_instructions_appendix: `\n${stagingRoutingLine('Margin Helper — STAGING')}` });
  assert.equal(compareProjectManifests(baseline, candidate).matches, true);
  assert.equal(routing({ instructions: staging.instructions }).status, 'passed');

  const drifted = createProjectManifest({ ...staging, files: [{ name: 'rules.md', content: 'changed rules' }, { name: 'encircle.md', content: 'real sixth file' }] }, { ignore_instructions_appendix: `\n${stagingRoutingLine('Margin Helper — STAGING')}` });
  const drift = compareProjectManifests(baseline, drifted);
  assert.equal(drift.changed[0].name, 'rules.md');
  assert.equal(typeof drift.changed[0].before_fingerprint, 'string');
  assert.equal(drift.changed[0].before_line_count, 1);
  assert.equal(checkStagingRouting({ live_title: 'Margin Helper', staging_skill_title: 'Margin Helper — STAGING', candidate: { name: 'STAGING — Another Project', instructions: staging.instructions } }).status, 'blocked');
});

test('review packet is ready only when change, evidence home, staging proof, every requirement, and rollback are present', () => {
  const baselineComparison = { matches: true, added: [], removed: [], changed: [], source_changed: [], instructions_changed: false, instruction_comparison: { before_fingerprint: 'before', after_fingerprint: 'before', before_line_count: 1, after_line_count: 1 } };
  const packet = createReviewPacket({ ticket: readyTicket, change_summary: 'Use the approved cost-code rule.', baseline_comparison: baselineComparison, staging_routing: routing(), checklist: readyChecklist(), rollback_plan: 'Restore the saved live version.', evidence_home: 'Drive/Pilot' });
  assert.equal(packet.status, 'ready for approval');
  assert.deepEqual(packet.what_was_not_tested, []);

  const partial = createRequirementChecklist([{ id: 'R-1', text: 'Use the correct cost code.' }]);
  const blocked = createReviewPacket({ ticket: readyTicket, change_summary: 'Fix rule', baseline_comparison: baselineComparison, staging_routing: routing(), checklist: partial, rollback_plan: 'Restore saved version', evidence_home: 'Drive/Pilot' });
  assert.equal(blocked.status, 'not ready for approval');
  assert.match(blocked.blockers.join(' '), /Not every stated requirement passed/);
});

test('local command runs the complete safe decision path without accessing an external system', async () => {
  const { stdout } = await run('node', ['tools/troubleshooting-operator/src/cli.mjs', '--input', 'tests/fixtures/operator/ready-scenario.json'], { cwd: repoRoot });
  const output = JSON.parse(stdout);
  assert.equal(output.status, 'local-only');
  assert.equal(output.ticket.request_location, 'comment C-1');
  assert.equal(output.next_move.action, 'run the first requirement check');
  assert.equal(output.review_packet.status, 'ready for approval');
  assert.match(output.message, /No external system/);
});
