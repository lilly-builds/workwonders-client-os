# Tier 3 verification contract: Sunday saved-copy checks

**Status: required before enabling a real Sunday runner. No live schedule is enabled.**

## Product promise

Every Sunday, every active client-facing project is checked against its complete Test Library using an approved saved copy. Passing projects receive a short Health Report. Each failed project starts one deep check for the specific failure. Lilly receives the findings. No live client project is changed.

**Tier:** 3, because this is a scheduled, multi-project, multi-stage workflow with external providers, client context, durable writes, and operational alerts.

## Real path and required subsystems

1. **Trigger:** approved cloud schedule on Sunday; exact time and timezone are still undecided.
2. **Authorization and context:** runner identity is authorized for the approved saved-copy location, all active project IDs, Client Bug/Update Board context, and Lilly's alert destination. Least privilege and tenant/project matching must be proven.
3. **Handler:** `/check-client-project` loads one saved copy and its Test Library, runs every test, writes one Health Report on pass, or starts one deep check on failure.
4. **Providers:** cloud scheduler/worker; saved-copy store; Client OS checker; Test Library; Drive or approved file store; Basecamp Bug Board for work visibility; alert channel to Lilly. The real Basecamp connector is unbuilt and unverified.
5. **Writes:** Health Report, deep-check investigation/Troubleshooting Card when needed, idempotency record, run status, and alert/audit record. A failed check must remain failed/needs review; tests are not dropped.
6. **Operator output:** run ID, project counts, every pass/fail, report links, deep-check links, stale/failed state, next owner, and alert outcome.
7. **Monitoring:** distinguish queued, in progress, complete, failed, stale, partial, and blocked; alert on worker failure, missing project, missing saved copy, malformed Test Library, duplicate claim, provider timeout, and stale run.

## Evidence contract

- **Positive:** all active projects with passing fixtures produce one Health Report each; repeat run produces no duplicate records.
- **Negative:** failed fixture starts exactly one deep check; malformed or unknown project context is rejected; no live update is callable.
- **Recovery:** worker timeout and restart resume or safely re-run by run ID; partial results remain visible; a retry does not duplicate an investigation or alert.
- **Regression:** a known prior failure still fails; every Test Library item remains required; the two-board separation and stage rules remain enforced.
- **Scale:** a production-like fixture set representing every active project, varied project sizes, at least one pass, one fail, one malformed copy, and one provider timeout. The full set must be processed; no sampling is acceptable.

## Production proof required

Before calling this live: Lilly must approve provider, permissions, cost ceiling, alert route, schedule, and disable action; a fresh reviewer must inspect the committed path; a dry run must prove all project IDs and saved-copy locations; one observed scheduled run must process the complete active-project set; the Health Reports, deep-check behavior, Basecamp status, alerts, idempotency, stale detection, and recovery must be observed; and the schedule must be disabled again unless a separate production approval keeps it on.

## Explicit exclusions for Phase 4

No real Basecamp access, Drive sync, cloud schedule, email, Claude Project, credentials, or client data. All are **unverified**, not mocked as live proof. The fake adapters prove contracts only.
