import {
  assertAccountSkillsChecked, assertBehaviorResult, assertCandidateLink, assertExplicitApproval, assertStagingTitle,
  assertExactTarget, assertExistingFilesOnly, assertFreshComparison, assertNoDuplicateFiles, assertProposedFileListComplete,
  assertRequiredComponents, compareFileLists, stagingTitle,
} from './guards.mjs';
import { assertPacketComplete, createPromotionPacket, releaseRecord } from './packet.mjs';

// This is the one orchestration layer. The old sync tool remains a transport
// primitive; it does not own approval, staging, promotion, or release proof.
export const previewUpdate = ({ live, proposed }) => {
  assertNoDuplicateFiles(live, 'live project');
  assertProposedFileListComplete(proposed, live);
  assertExistingFilesOnly(proposed, live);
  const liveByName = new Map((live.docs ?? []).map((doc) => [doc.file_name, doc]));
  const changes = [];
  if (live.instructions !== proposed.instructions) changes.push({ file_name: 'instructions', kind: 'update' });
  for (const doc of proposed.docs ?? []) {
    if (!liveByName.has(doc.file_name)) throw new Error(`Unexpected new file: ${doc.file_name}`);
    changes.push({ file_name: doc.file_name, kind: 'update' });
  }
  return { target_id: live.uuid, target_name: live.name, changes, visible: true };
};

export const runControlledUpdate = async ({ request, transport, behaviorRunner, now = new Date().toISOString() }) => {
  if (!request?.live_project_id || !request?.proposed) throw new Error('Exact live project ID and proposed files are required.');
  if (request.write !== true) return { status: 'preview-only', preview: previewUpdate({ live: request.live, proposed: request.proposed }) };
  assertExplicitApproval(request.approval);
  if (!request.named_target) throw new Error('A named target is required.');
  behaviorRunner ??= async () => ({ status: 'not-run' });

  const live = await transport.readProject(request.live_project_id);
  assertExactTarget(live, request.live_project_id);
  const preview = previewUpdate({ live, proposed: request.proposed });
  const baseline = request.baseline ?? live;
  let candidate = null;
  if (transport.canClone) {
    const name = stagingTitle(live.name);
    candidate = await transport.cloneProject({ source: live, name });
    assertCandidateLink(candidate, live.uuid);
    compareFileLists(candidate, baseline, 'Candidate');
    assertRequiredComponents(candidate, baseline, request.required_components ?? []);
    await transport.writeApproved(candidate.uuid, request.proposed, preview.changes);
    const candidateAfter = await transport.readProject(candidate.uuid);
    assertStagingTitle(candidateAfter.name);
    assertCandidateLink(candidateAfter, live.uuid);
    assertNoDuplicateFiles(candidateAfter, 'candidate');
    assertFreshComparison(await transport.compareFresh(candidate.uuid, request.proposed), 'Candidate');
    const candidateBehavior = await behaviorRunner(candidateAfter, 'candidate');
    assertBehaviorResult(candidateBehavior, 'Candidate');
    assertAccountSkillsChecked({ required: request.account_level_skills_required, candidateChecked: request.candidate_skills_checked, liveChecked: request.live_skills_checked });
    const packet = createPromotionPacket({
      createdAt: now, changeSummary: request.change_summary, targetMap: { live_project_id: live.uuid, live_project_name: live.name, candidate_project_id: candidate.uuid, candidate_project_name: candidate.name },
      approvedFiles: preview.changes.map((change) => change.file_name), candidateBehaviorEvidence: candidateBehavior,
      lillyReview: request.lilly_review, promotionPlan: { only_approved_files: true, files: preview.changes.map((change) => change.file_name) }, rollbackAction: request.rollback_action,
      candidateOwner: request.candidate_owner, stagingCleanup: { expiry: request.staging_expiry, rule: request.staging_cleanup_rule }, permanentCheck: request.permanent_check,
    });
    assertPacketComplete(packet);
    if (request.lilly_review?.decision !== 'approved' || request.lilly_review?.reviewer !== 'Lilly') throw new Error('Lilly review is required before promotion.');
    try {
      await transport.writeApproved(live.uuid, request.proposed, preview.changes);
      assertExactTarget(await transport.readProject(request.live_project_id), request.live_project_id);
      const liveAfter = await transport.readProject(request.live_project_id);
      assertFreshComparison(await transport.compareFresh(live.uuid, request.proposed), 'Live');
      const liveBehavior = await behaviorRunner(liveAfter, 'live');
      assertBehaviorResult(liveBehavior, 'Live');
      packet.live_proof = { status: 'verified', fresh_comparison: true, behavior: liveBehavior };
      const record = releaseRecord({ packet, status: 'verified', permanentCheck: request.permanent_check });
      await transport.saveReleaseRecord(record);
      return { status: 'verified', preview, candidate, packet, release_record: record };
    } catch (liveError) {
      let rollback = { attempted: true, succeeded: false, error: 'restoreProject is unavailable.' };
      try {
        if (typeof transport.restoreProject !== 'function') throw new Error(rollback.error);
        await transport.restoreProject(live.uuid, live);
        assertFreshComparison(await transport.compareFresh(live.uuid, live), 'Rollback');
        rollback = { attempted: true, succeeded: true };
      } catch (rollbackError) {
        rollback = { attempted: true, succeeded: false, error: rollbackError.message };
      }
      packet.live_proof = { status: 'failed', error: liveError.message, rollback };
      const record = releaseRecord({ packet, status: 'failed verification', permanentCheck: request.permanent_check });
      await transport.saveReleaseRecord(record);
      const suffix = rollback.succeeded ? 'The prior version was restored.' : `Rollback also failed: ${rollback.error}`;
      throw new Error(`Live verification failed: ${liveError.message} ${suffix}`);
    }
  }
  throw new Error('Faithful candidate cloning is unavailable; no live write is allowed.');
};
