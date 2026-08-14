const required = [
  'change_summary', 'target_map', 'approved_files', 'candidate_behavior_evidence',
  'lilly_review', 'promotion_plan', 'rollback_action', 'live_proof',
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
});

export const assertPacketComplete = (packet) => {
  const missing = required.filter((key) => packet?.[key] === undefined || packet[key] === null);
  if (missing.length) throw new Error(`Promotion packet is incomplete: ${missing.join(', ')}`);
  if (!Array.isArray(packet.approved_files) || packet.approved_files.length === 0) {
    throw new Error('Promotion packet must name at least one approved file.');
  }
  return true;
};

export const releaseRecord = ({ packet, status, permanentCheck }) => ({
  schema: 'client-update-release/v1',
  status,
  update_packet: packet,
  permanent_check: permanentCheck,
  live_update_performed: status === 'verified',
  account_level_skills: 'not checked unless explicitly evidenced',
});
