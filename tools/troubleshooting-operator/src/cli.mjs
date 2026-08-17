#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { intakeTicket, nextOperatorMove } from './flow.mjs';
import { assessConnectorReadiness } from './connector-readiness.mjs';
import { createRequirementChecklist, recordRequirementResult, scoreRequirements } from './requirements.mjs';
import { checkStagingRouting, compareProjectManifests, createProjectManifest } from './staging.mjs';
import { createReviewPacket } from './review-packet.mjs';

const index = process.argv.indexOf('--input');
if (index === -1 || !process.argv[index + 1]) {
  console.error('Usage: npm run operate --prefix tools/troubleshooting-operator -- --input <sanitized-scenario.json>');
  process.exit(2);
}

const input = process.argv[index + 1];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const readScenario = async () => {
  try { return await readFile(input, 'utf8'); }
  catch (error) {
    if (path.isAbsolute(input) || error.code !== 'ENOENT') throw error;
    return readFile(path.resolve(repoRoot, input), 'utf8');
  }
};
const scenario = JSON.parse(await readScenario());
const ticket = intakeTicket(scenario.ticket);
const connector_readiness = assessConnectorReadiness(scenario.connectors);
const move = nextOperatorMove({ ticket, evidence_home: scenario.evidence_home, connector_readiness, failed_attempts: scenario.failed_attempts, next_owner: scenario.next_owner });
let checklist = createRequirementChecklist(scenario.requirements ?? []);
for (const result of scenario.requirement_results ?? []) checklist = recordRequirementResult(checklist, result);
const baseline = scenario.live_project ? createProjectManifest(scenario.live_project) : null;
const routingAppendix = scenario.staging ? `\n${checkStagingRouting(scenario.staging).routing_line}` : null;
const candidate = scenario.staging_project ? createProjectManifest(scenario.staging_project, { ignore_instructions_appendix: routingAppendix }) : null;
const baseline_comparison = baseline && candidate ? compareProjectManifests(baseline, candidate) : { matches: false, reason: 'A live and staging project manifest are both required.' };
const staging_routing = scenario.staging ? checkStagingRouting(scenario.staging) : { status: 'blocked', plain_summary: 'No staging routing was supplied.' };
const review_packet = createReviewPacket({ ticket, change_summary: scenario.change_summary, baseline_comparison, staging_routing, checklist, rollback_plan: scenario.rollback_plan, evidence_home: scenario.evidence_home });
console.log(JSON.stringify({ status: 'local-only', ticket, connector_readiness, next_move: move, requirement_summary: scoreRequirements(checklist), staging_comparison: baseline_comparison, review_packet, message: 'No external system was accessed or changed.' }, null, 2));
