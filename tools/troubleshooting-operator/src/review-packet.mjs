import { scoreRequirements } from './requirements.mjs';

const clean = (value) => String(value ?? '').trim();

export const createReviewPacket = ({ ticket, change_summary, baseline_comparison, staging_routing, checklist, rollback_plan, evidence_home }) => {
  const score = scoreRequirements(checklist);
  const blockers = [
    !clean(evidence_home) ? 'No approved evidence home is recorded.' : null,
    !clean(change_summary) ? 'No plain-language change summary is recorded.' : null,
    baseline_comparison?.matches !== true ? 'The staging copy does not match the saved baseline.' : null,
    staging_routing?.status !== 'passed' ? 'The staging project is not isolated to its staging skill.' : null,
    score.overall_status !== 'passed' ? 'Not every stated requirement passed with evidence.' : null,
    !clean(rollback_plan) ? 'No rollback plan is recorded.' : null,
  ].filter(Boolean);
  return {
    status: blockers.length ? 'not ready for approval' : 'ready for approval',
    request: ticket?.request_text ?? 'No request was found.',
    request_location: ticket?.request_location ?? null,
    what_changed: clean(change_summary) || 'No change has been proposed.',
    what_compared: baseline_comparison,
    staging_check: staging_routing,
    requirement_results: checklist,
    requirement_summary: score,
    what_was_not_tested: score.not_proven,
    rollback_plan: clean(rollback_plan) || null,
    evidence_home: clean(evidence_home) || null,
    blockers,
  };
};
