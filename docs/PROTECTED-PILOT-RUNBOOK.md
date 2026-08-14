# Protected pilot runbook

**Status:** blocked pending written authorization and safe credentials  
**Version:** 1.0  
**Prepared:** 2026-08-13  
**Pilot owner:** Lilly  
**Usability reviewer:** Jim

## Purpose and decision rule

This runbook proves the intended troubleshooting path for one approved pilot
context. It does not make every connector live, and it does not authorize a
client-wide rollout.

The product promise is:

> A team member can start one guided troubleshooting run and receive a clear
> shared record of what happened, what was checked, what is still unknown, and
> the next safe action.

The pilot is **go** only when the approved path is exercised end to end and
Lilly signs the checklist. It is **no-go** when any required authorization is
missing, any enabled step is untested, or any failure is hidden as a pass.

## Non-negotiable safety rules

- Use one approved pilot client or a clearly approved non-client test project.
- Keep credentials, browser profiles, raw exports, client names, IDs, and
  responses outside this repository.
- Never use a manual run as proof of a scheduled run.
- Never promote a candidate without Lilly's recorded approval.
- Never send a client email for an internally found issue unless Lilly approves
  that client-facing action.
- Never resume the 18-project upload or expand to all clients from this pilot.
- Stop on an unknown project, unknown board, duplicate claim, unexpected file,
  missing source, missing account-level Skill, stale run, or failed rollback.

## Required written authorization

Complete `PROTECTED-PILOT-CONFIGURATION-CHECKLIST.md` before changing any
external system. Blank or incomplete authorization means **blocked**.

## Smallest safe pilot

The recommended first pilot is deliberately smaller than the full system:

- one approved non-client or test project;
- a local/manual trigger only;
- a saved-copy read path and the smallest required Drive/board write path for
  the records being proven;
- one Client Bug Board triage slice: pull one approved card, respond to it,
  and move it through the appropriate bug stage;
- no Microsoft email;
- no live update or candidate promotion;
- no cloud schedule or cloud alerting;
- read-only access to source material wherever the evidence can be collected
  without a write.

This pilot proves the basic troubleshooting and record path first. Scheduling,
email, and live updates are separate approvals after this pilot passes.

## Intended reachable path

1. Approved trigger: a named pilot issue or an approved scheduled run.
2. The Client Bug Board card is pulled and its client/project identity is
   checked before reading or writing.
3. `/check-client-project` or `/debug-client-project` runs against the approved
   saved copy and complete Test Library.
4. A Health Report is written for a pass; a failure starts one deep check.
5. The same Bug Board card receives the response, owner, next action, evidence
   link, and correct stage. It is never duplicated.
6. A next owner and next action are recorded.
7. An approved update, if in scope, follows candidate testing, Lilly review,
   exact-live promotion, fresh comparison, live retest, and Release Record.
8. Monitoring records in-progress, failed, stale, and complete states.

## Execution sequence

### A. Preflight

- Record the pilot scope, project ID/name, approved folder, and one Bug Board
  card or approved card-creation scope. Record scheduling, email, and live
  project details only when those optional paths are in scope.
- Confirm the saved copy and Test Library are complete and belong to the same
  project.
- Confirm the repository is clean and the prior phase test suite passes.
- Confirm a fresh reviewer has inspected the committed path.
- Do not proceed if any external authorization is absent.

### B. Safe positive control

- Pull one approved card from the Client Bug Board through the approved
  Basecamp path.
- Confirm the card has the required fields and starts in the expected stage.
- Trigger the run from that card through the approved entry point.
- Verify client/project identity before processing the saved copy.
- Run every Test Library item; do not sample.
- Confirm one Health Report, one response on the same Bug Board card, the
  correct stage transition, and no duplicate records.
- Record evidence references outside the repository.

### C. Safe negative control

- Use an unknown project, malformed saved copy, or malformed Bug Board card in
  the approved test area.
- Confirm the run rejects it before a Drive or Basecamp write.
- Confirm a failed check remains failed or needs review and starts one deep check.

### D. Recovery control

- Stop or time out a run after a visible partial result.
- Restart it using the same run ID.
- Confirm partial work remains visible, the run resumes or safely re-runs, and
  no investigation, Bug Board response, report, or alert is duplicated.

### E. Regression and realistic sample controls

- Re-run a known prior failure and confirm it still fails in the expected way.
- Process a realistic multi-project sample containing a pass, a fail, a
  malformed copy, varied Test Library sizes, and a provider-timeout case.
- Process the complete approved sample; do not reduce coverage.

### F. Optional scheduled-run proof

Only if the checklist authorizes it:

- Configure the cloud schedule and monitoring with the approved provider.
- Observe one actual scheduled Sunday run, including its run ID and timezone.
- Verify in-progress, complete, failed, and stale monitoring states plus the
  Lilly alert route.
- Disable the schedule again unless Lilly records separate approval to keep it.

A manual command is local evidence only, not scheduled-run evidence.

### G. Optional live-update proof

Only if the checklist authorizes it:

- Record the exact live project ID/name and a separate candidate ID/name.
- Confirm the candidate title begins `STAGING — ` and links back to live.
- Apply only the approved change to candidate and run the full behavior set.
- Obtain Lilly's review of the original question, fixed safety questions, and
  the open question “Does anything else look off?”.
- Promote only the approved files to the exact live ID.
- Pull and compare fresh copies, then re-run the behavior set against live.
- Record the Release Record, rollback result, and candidate cleanup decision.
- If the issue was client-reported, send the approved plain-language email only
  after internal verification. Otherwise keep it internal.

## Exact pilot evidence to save

For the smallest safe pilot, save this exact evidence outside the repository:

1. Run ID and trigger time.
2. Complete Test Library results, including any failed or rejected test.
3. The Health Report.
4. The Bug Board card, stage, and link to the Drive record.
5. Failure and recovery evidence, including duplicate-protection results.
6. The fetched Bug Board card ID, original stage, response, final stage, and
   link to the Drive record.
7. Lilly's reviewer sign-off and Jim's plain-language usability readout.
8. A plain list of every connector, control, and behavior not tested.

Add these only when the corresponding optional path is approved: scheduled-run
ID and monitoring evidence; alert evidence; candidate/live identity and
behavior responses; Release Record; rollback result; and approved client email
evidence.

## Evidence register

| Evidence | Required proof | Result | Evidence reference |
|---|---|---|---|
| Pilot identity | Scope, project ID, owner, and folder match | Pending | Outside repository |
| Trigger | Approved entry point and run ID | Pending | Outside repository |
| Drive record | Correct folder and one linked record | Pending | Outside repository |
| Bug Board | Correct board/card/stage and link | Pending | Outside repository |
| Check/deep check | Every test run; failure starts one deep check | Pending | Outside repository |
| Next action | Named owner and action | Pending | Outside repository |
| Release Record | Only for an approved live update | Not in smallest pilot | N/A |
| Monitoring | In-progress, failed, stale, complete | Not in smallest pilot | N/A |
| Alert | Lilly receives the correct failure alert | Not in smallest pilot | N/A |
| Scheduled run | Observed cloud-triggered run | Not in smallest pilot | N/A |
| Client email | Only after internal verification and approval | Not in smallest pilot | N/A |

## Final review

Before a go/no-go decision, perform a fresh-context review using the
no-drifting questions: real trigger, identity and permissions, handler, every
provider, persistence, output surface, monitoring, and the exact end-to-end
path. Mark every unproven layer as a blocker.

Lilly signs the rollout decision. Jim records whether the instructions were
understandable without developer knowledge. Neither signature is implied by
preparation of this document.
