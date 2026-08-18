# Basecamp board contract (Phase 4)

The real `/basecamp` skill or supported interface was not available in this worktree. These are safe, tested adapter boundaries only; they do not connect to Basecamp.

## Client Debug Tickets

Approved board: [Client Debug Tickets](https://app.basecamp.com/5730006/buckets/48267142/card_tables/10133060890)

Stages: **New → In progress → Complete → Client verified complete**.

Required card fields: card ID, client, project, original client message, owner, next action, evidence links, and final client email link. One card represents one reported or detected problem. Lilly is the first owner when intake starts. Complete requires a proven cause, retest, broader checks, approved deployment when needed, a client email when applicable, and a permanent check. Silence never means client verified.

## Client Updates

Approved board: [Client Updates](https://app.basecamp.com/5730006/buckets/48267142/card_tables/10197329775)

Stages: **Proposed → Approved → Deployed → Verified**, or **Blocked**.

Required card fields: card ID, client, project ID, linked bug card when relevant, change summary, Lilly approver, release record link, post-update check, and rollback action. This is a separate card table and never replaces a bug card.

## Adapter rules

- The exact board URL is checked before a card is accepted.
- Required fields and stage names are checked before work starts.
- A saved card ID is claimed once: one bug card can start one investigation, and one update card can start one release action. Claims use a directory lock so simultaneous local calls cannot both win. A future real adapter must provide equivalent atomic claiming.
- Unknown board, malformed card, duplicate card, and conflicting card links fail clearly; they are not skipped.
- Bug and update cards may link to each other, but remain separate records. Update cards may queue a release action only from Proposed or Approved; Deployed, Verified, and Blocked cards fail clearly until an explicit new action exists.
- `tools/basecamp-adapters/src/idempotency.mjs` is the storage contract: durable implementations must provide `claim(kind, cardId, action)` and return `duplicate: true` on a repeat.
