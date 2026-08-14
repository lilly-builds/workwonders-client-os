# Sunday cloud runner provider decision record

**Status: decision deferred; no schedule enabled.**

The Sunday check must run across all active client-facing projects and send findings to Lilly only. No provider is selected in Phase 4 because the Basecamp and client-material access boundaries are not available for a safe comparison.

## Decision criteria

1. **Reliability:** documented scheduling guarantees, retry behavior, timeout handling, regional/service history, and an observable run ID.
2. **Cost:** predictable per-run and storage cost for all active projects, with a monthly ceiling and a cost alert.
3. **Safe access:** least-privilege access to approved saved copies and the two Basecamp boards; no laptop session, broad account token, or live project write permission; secret rotation and audit trail.
4. **Monitoring:** clear in-progress, complete, failed, and stale states; failure alerts to Lilly; durable Health Reports; operator-visible run history; safe replay without duplicate investigations.
5. **Recovery:** bounded retries, resumability, no silent reduction in projects/tests/providers, and a documented disable/rollback action.

## Candidates to compare later

Claude, Codex, and another approved cloud scheduler/worker are candidates only. Convenience is not a decision criterion. The selected provider must pass the Tier 3 verification contract and a fresh-context review before any credential or schedule is configured.

## Current blockers

The Basecamp skill/interface and authentication method are unavailable. Cloud credentials, approved saved-copy location, alert destination, and client authorization are also unverified. Therefore this record makes no provider recommendation and enables no schedule.
