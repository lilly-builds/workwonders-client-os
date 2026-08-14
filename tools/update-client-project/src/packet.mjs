const required = [
  'change_summary', 'target_map', 'approved_files', 'candidate_behavior_evidence',
  'lilly_review', 'promotion_plan', 'rollback_action', 'live_proof', 'candidate_owner',
  'staging_cleanup', 'permanent_check',
];

export const createPromotionPacket = (input) => ({
  schema: 'client-update-packet/v1',
  created_at: input.createdAt ?? new Date().toISOString(),
  change_summary: input.changeSummary,
  target_map: input.targetMap,
  approved_files: input.approvedFiles,
  candidate_behavior_evidence: input.candidateBehaviorEvidence,
  lilly_review: input.lillyReview,
  promotion_plan: input.promotionPlan,
  rollback_action: input.rollbackAction,
  live_proof: input.liveProof ?? { status: 'not-run' },
  candidate_owner: input.candidateOwner,
  staging_cleanup: input.stagingCleanup,
  permanent_check: input.permanentCheck,
});

export const assertPacketComplete = (packet) => {
  const missing = required.filter((key) => packet?.[key] === undefined || packet[key] === null);
  if (missing.length) throw new Error(`Promotion packet is incomplete: ${missing.join(', ')}`);
  if (!Array.isArray(packet.approved_files) || packet.approved_files.length === 0) {
    throw new Error('Promotion packet must name at least one approved file.');
  }
  if (!packet.target_map?.live_project_id || !packet.target_map?.candidate_project_id || packet.target_map.live_project_id === packet.target_map.candidate_project_id) {
    throw new Error('Promotion packet must contain two different live and candidate project IDs.');
  }
  if (!packet.target_map.live_project_name || !packet.target_map.candidate_project_name) throw new Error('Promotion packet must name both target projects.');
  if (packet.approved_files.some((name) => typeof name !== 'string' || !name.trim())) throw new Error('Approved file names must be useful names.');
  if (packet.candidate_behavior_evidence?.status !== 'passed' || !packet.candidate_behavior_evidence?.evidence_location) throw new Error('Promotion packet must contain passing candidate behavior evidence and its location.');
  if (packet.lilly_review?.reviewer !== 'Lilly' || packet.lilly_review?.decision !== 'approved' || !packet.lilly_review?.reviewed_at) throw new Error('Promotion packet must contain Lilly approval details.');
  if (packet.promotion_plan?.only_approved_files !== true || JSON.stringify(packet.promotion_plan.files ?? []) !== JSON.stringify(packet.approved_files)) throw new Error('Promotion plan must promote only the approved file list.');
  if (!packet.rollback_action || !String(packet.rollback_action).trim()) throw new Error('Promotion packet must contain rollback instructions.');
  if (!packet.live_proof?.status || !['not-run', 'verified', 'failed'].includes(packet.live_proof.status)) throw new Error('Promotion packet must contain a valid live proof status.');
  if (!packet.candidate_owner || !packet.staging_cleanup?.expiry || !packet.staging_cleanup?.rule) throw new Error('Promotion packet must contain staging owner and cleanup details.');
  if (!packet.permanent_check || !packet.permanent_check.type || !packet.permanent_check.reference) throw new Error('Promotion packet must name a permanent check.');
  return true;
};

export const releaseRecord = ({ packet, status, permanentCheck }) => ({
  schema: 'client-update-release/v1',
  status,
  update_packet: packet,
  permanent_check: permanentCheck,
  live_update_performed: status === 'verified',
  account_level_skills: 'not checked unless explicitly evidenced',
  candidate_owner: packet.candidate_owner,
  staging_cleanup: packet.staging_cleanup,
});
