# No-drifting layer map — Phase 4

**Feature path:** Sunday trigger or a Basecamp card starts a saved-copy check or investigation, which writes local client records and reports status to an operator.

| Layer | Phase 4 state | Evidence / gap |
|---|---|---|
| Trigger | Local checker CLI and adapter methods | Tested locally; Sunday cloud trigger is not connected |
| Authorization / client context | Explicit project ID, mode, board URL, card validation | Fake context tested; real auth and tenant permissions unverified |
| Checker / deep check | `/system-health-check` and existing investigation runner | Fixture tests exercise the local entry path |
| Test Library | JSON format and loader | Fixture tests exercise required fields and all items |
| Saved-copy source | Local JSON fixture | Real Drive or approved store unverified |
| Debug Tickets board | Separate validated adapter and idempotency boundary | Fake tests only; real `/basecamp` interface unavailable |
| Updates board | Separate validated adapter and idempotency boundary | Fake tests only; no live update action |
| Persistence | Control Center reports/issues plus idempotency JSON contract | Local writes tested; real Drive sync/storage unverified |
| Monitoring / alerts | Contract documented only | No cloud runner, alert provider, or stale monitor built |
| Operator output | CLI summary and report fields | Local output tested; Basecamp/operator surface unverified |
| Schedule | Not built or enabled | Deliberately blocked pending Tier 3 proof |

Unconnected real layers: Basecamp authentication/interface, cloud scheduler/worker, Drive sync or approved saved-copy store, alert delivery, and production client authorization. They remain plainly unverified.
