# Phase 4 handoff: repeatable checks and safe work queue

## Entry points

- `/check-client-project` is represented by `tools/check-client-project/src/cli.mjs` and `runClientProjectCheck`. It accepts a saved-copy JSON fixture and a Test Library JSON file. In fake mode, a full pass writes one short Health Report; a failure automatically calls the existing deep-check runner once and writes its evidence packet.
- Test Library items require `test_id`, `purpose`, `setup`, `steps`, `expected_result`, `check_method`, `refresh_date`, `scope`, and `owner`. Every item is run; no sampling or reduced coverage is allowed. Each item must include refresh_date, scope (shared or client-specific), and owner.

## Adapter boundaries

- `createBugBoardAdapter` accepts only the approved Client Debug Tickets URL, validates the required fields and stages, and claims one investigation per card ID.
- `createUpdateBoardAdapter` accepts only the approved Client Updates URL, validates the required fields and stages, and claims one release action per card ID.
- `createIdempotencyStore(file)` is the persistence contract. A future real adapter must provide the same atomic `claim(kind, cardId, action)` behavior and retain claims durably; simultaneous claims must have one winner.
- `linkCards` links bug and update IDs without merging their cards.
- `knownCardIds` in a fetched board context lets the adapter reject an unknown card clearly.

The real `/basecamp` skill/interface was unavailable. No live Basecamp call, authentication, schedule, Drive, email, or client project was used.

## Provider and cloud gate

Use `docs/PROVIDER-DECISION-RECORD.md` to compare reliability, cost, safe access, monitoring, and recovery. Use `docs/TIER-3-SUNDAY-VERIFICATION-CONTRACT.md` as the required preflight contract. Use `docs/NO-DRIFTING-LAYER-MAP-PHASE4.md` to see every connected and unconnected layer.

## Prompt 5 boundary

Prompt 5 may build the controlled update path. It must preserve the separate Updates board boundary, card-idempotency contract, card-linking contract, and the explicit statement that real Basecamp/cloud access is unverified. Sunday scheduling stays disabled. Prompt 6 is the only phase allowed to connect approved real systems.
