import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { writeInvestigationRecords } from '../../troubleshooting-folder/src/control-center.mjs';

const today = () => new Date().toISOString().slice(0, 10);
const clean = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

export function guidedQuestions() {
  return [
    'Which client and project are we checking?',
    'What did you expect the project to do, and what happened instead?',
    'I will make a fresh saved-copy check and test the basics. Is this the correct saved copy?',
  ];
}

export async function loadFakeSavedCopy(savedCopyPath) {
  const saved = JSON.parse(await readFile(savedCopyPath, 'utf8'));
  if (!saved.project_id || !Array.isArray(saved.checks)) throw new Error('The fake saved copy must name a project and list its checks.');
  return saved;
}

function defaultCauses(saved) {
  return saved.likely_causes || [
    { id: 'rule', label: 'A project rule or instruction is wrong', category: 'project rule' },
    { id: 'data', label: 'The source data is missing, wrong, or conflicting', category: 'data' },
    { id: 'decision', label: 'A business decision is missing', category: 'business decision' },
    { id: 'source', label: 'The project is using the wrong source', category: 'project rule' },
    { id: 'tool', label: 'The saved project copy has a tool or file problem', category: 'developer' },
  ];
}

function findCheck(saved, cause) {
  return saved.checks.find((check) => check.cause_id === cause.id);
}

export async function planDeepCheck(saved) {
  const original = defaultCauses(saved).slice(0, 5);
  const causes = [...original];
  const attempts = [];
  let newCauses = 0;
  for (let index = 0; index < causes.length; index += 1) {
    const cause = causes[index];
    const check = findCheck(saved, cause) || { result: 'inconclusive', evidence: 'No check was supplied in the saved copy.' };
    attempts.push({ order: index + 1, cause: cause.label, category: cause.category, proves: `Evidence that would prove: ${cause.label}.`, disproves: `Evidence that would disprove: ${cause.label}.`, result: check.result, evidence: clean(check.evidence || 'No evidence recorded.') });
    if (check.result === 'proven') return { original, attempts, rootCause: { ...cause, evidence: check.evidence }, stopReason: 'A likely cause was proven.', newCauses };
    if (check.result === 'new_cause' && newCauses < 2 && check.new_cause) {
      const added = { id: `evidence-${newCauses + 1}`, label: check.new_cause.label, category: check.new_cause.category || 'developer', suggestedBy: cause.label };
      causes.push(added); newCauses += 1;
    }
  }
  return { original, attempts, rootCause: null, stopReason: newCauses >= 2 ? 'The two evidence-led new-cause limit was reached.' : 'The original likely causes were checked without a clear answer.', newCauses };
}

function formatAttempts(attempts) {
  return attempts.map((a) => `${a.order}. ${a.cause} — ${a.result}. ${a.proves} ${a.disproves} Evidence: ${a.evidence}`).join('\n');
}

export async function investigate({ controlCenterDir, project, clientName, complaint, savedCopyPath, issueId, operator = 'Lilly', clientOwner = 'named client owner', date = today(), mode = 'fake', repoRoot }) {
  const saved = await loadFakeSavedCopy(savedCopyPath);
  if (saved.project_id !== project.id) throw new Error(`Saved copy project ${saved.project_id} does not match ${project.id}.`);
  const plan = await planDeepCheck(saved);
  const root = plan.rootCause;
  const cardId = `CARD-${issueId}`;
  const reportId = `REPORT-${issueId}`;
  const evidenceReference = `${cardId}; saved-copy: ${path.basename(savedCopyPath)}`;
  const category = root?.category;
  const data = category === 'data';
  const business = category === 'business decision';
  const unresolved = !root;
  const status = unresolved || business || data ? 'blocked' : 'passed';
  const nextOwner = data ? clientOwner : business ? 'Client decision owner' : unresolved ? 'Developer' : operator;
  const nextAction = data ? `Ask ${clientOwner} to correct the named source, then re-run the original check.` : business ? 'Ask the named business owner to choose the official rule or source, then re-run the original check.' : unresolved ? 'Escalate with the full evidence packet in a developer ticket.' : 'Prepare a safe reusable check; do not change the live project. If a live change is later proposed, show a preview and ask Lilly: “Shall we proceed?” (yes/no).';
  const remaining = root ? 'None for the tested question.' : 'The root cause is still unknown after the allowed checks.';
  const issue = { issueId, date, title: `Investigation ${issueId}`, symptoms: clean(complaint), provenRootCause: root ? `${root.label}. Evidence: ${clean(root.evidence)}` : 'Not yet proven after the allowed checks.', solution: root ? 'No live change was made. Prepare the safe next action only.' : 'No live change is safe; escalate with the evidence packet.', permanentCheck: root && !data && !business ? 'Prepare a shared or client-specific Test Library entry from this proven cause; do not apply it yet.' : 'Not yet prepared because the cause or decision is not settled.', evidenceReference, impact: 'Fictional local test only; no live client was touched.', owner: nextOwner, status: root && !business && !data ? 'in progress' : 'blocked', reportLinks: `reports/${reportId}` };
  const card = { cardId, date, title: `Troubleshooting Card — ${issueId}`, question: `Why did ${project.name} produce the reported result?`, currentAnswer: root ? `Likely cause: ${root.label}.` : 'Not known after the allowed checks.', likelyCauses: plan.original.map((c) => c.label).join('; '), testsAttempted: plan.attempts.map((a) => a.cause).join('; '), results: formatAttempts(plan.attempts), ruledOutCauses: plan.attempts.filter((a) => a.result === 'disproved').map((a) => a.cause).join('; ') || 'None yet.', remainingTheories: remaining, evidenceReference, status, checkedBy: operator, checkedOn: date, nextOwner, nextAction, checkMethod: 'Run the ordered checks against the named fake saved-copy fixture and record each result.', detail: `Stop rule: ${plan.stopReason}\nOriginal causes checked: ${plan.original.length}. Evidence-led new causes checked: ${plan.newCauses}. Lilly approval is required before any proposed live change. Preview required; no live update was performed.` };
  const healthReport = { reportId, date, title: `${clientName} ${project.name} Health Report`, scope: `The reported problem in ${project.name}`, overallStatus: status === 'passed' ? 'needs review' : 'blocked', known: `The complaint was recorded. ${plan.attempts.length} ordered checks were recorded. ${root ? `The leading cause is ${root.label}.` : 'No root cause was proven.'}`, unknown: 'No live project, connector, or client data was checked.', nextOwner, nextAction };
  const dataReport = data ? { reportId: `DATA-${issueId}`, date, title: `Data Integrity Report — ${issueId}`, dataArea: saved.data_area || 'Named source in the fake saved copy', checkMethod: 'Compare the named source with the expected value in the fake saved copy.', finding: saved.data_finding || root.evidence, evidenceReference, status: 'needs review', owner: clientOwner, impact: saved.data_impact || 'The project may give the wrong answer until the source is corrected.', correction: saved.data_correction || 'Update the named source to the agreed value in the approved source location.', recheck: 'Re-run the original check after the owner confirms the correction.', nextAction: `Waiting on ${clientOwner}: correct the source, then re-run the original check.` } : null;
  const developerTicket = unresolved ? { ticketId: `DEV-${issueId}`, date, title: `Developer Ticket — ${issueId}`, problem: clean(complaint), expectedBehavior: 'The project should answer the original question using the approved saved-copy sources.', proposedChange: 'Review the complete evidence packet and propose a bounded change only after the remaining theory is confirmed.', acceptanceCheck: 'Re-run every attempted check, the original complaint check, and the relevant broader checks; record evidence for each.', owner: 'Developer', priority: saved.priority || 'medium', attemptedTests: formatAttempts(plan.attempts), evidence: evidenceReference, ruledOutCauses: card.ruledOutCauses, remainingTheories: card.remainingTheories } : null;
  const result = await writeInvestigationRecords({ outputDir: controlCenterDir, project, issue, card, healthReport, dataReport, developerTicket, mode, repoRoot });
  return { issueId, cardId, plan, issue, card, healthReport, dataReport, developerTicket, result, summary: { known: healthReport.known, unknown: healthReport.unknown, nextOwner, nextAction } };
}
