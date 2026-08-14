# Phase 5: one controlled update front door

## Naming decision

`/update-client-project` **wraps** the existing `/update-claude-project` path.
The old skill name is a backwards-compatible redirect only. Its sync scripts
remain transport primitives; approval, candidate handling, behavior tests,
promotion, and release proof live in one orchestration layer.

## Behavior-test contract

- **Original problem question:** supplied by the issue record; it is required.
- **Fixed safety questions:** correct source; all relevant pages; cost-code
  use; denied-bill exclusion; cost-versus-price separation.
- **Open question:** `Does anything else look off?` It is a discovery signal and
  requires Lilly's human review. It is not a standalone pass/fail test.
- **Expected results:** each fixed question has an explicit expected result;
  every fixed question must run and match it.
- **Allowed test data:** sanitized fixtures or an approved non-client test
  project. No client data is stored in this repository.
- **Evidence home:** the client Drive Release Record and its linked promotion
  packet; local tests use sanitized fixture evidence.
- **Reviewer:** Lilly.
- **Pass:** every fixed question matches, evidence exists, and Lilly reviewed
  the open question with no unresolved concern.
- **Fail/not run:** any mismatch, skipped question, missing evidence, or
  unreviewed concern. No skipped test becomes a pass.

## Candidate-project contract

The candidate is cloned from the saved live baseline and must be titled exactly
`STAGING — [live project title]`. `STAGING` is first and all caps. The record
stores the source live project ID, candidate ID/name, owner (Lilly), and an
expiry/cleanup decision after promotion. Candidate files and sources must match
the production baseline before the proposed change. Account-level Skills cannot
be copied or claimed unless they are separately compared and tested.

Promotion maps only the approved file list to the exact live ID. The whole
candidate is never copied blindly. A missing prefix, untracked duplicate,
missing required component, identity mismatch, or fresh comparison failure
stops the flow.

## Promotion packet and homes

The packet contains: change summary, target map, exact approved files, candidate
behavior evidence, Lilly's review decision, promotion plan, rollback action,
and live proof. The detailed packet and Release Record live in the client's
Drive. The Client Update Board card links to them:

https://app.basecamp.com/5730006/buckets/48267142/card_tables/10197329775

The Client Bug Board remains separate:

https://app.basecamp.com/5730006/buckets/48267142/card_tables/10133060890

## Verification status for this phase

Local unit/integration tests use an in-memory mocked transport. No client
project, client Drive, browser profile, Basecamp connection, email, account
Skill, or live behavior test was used. The CLI is preview-only in this phase.
The real candidate → Lilly review → live promotion path remains unverified and
needs Prompt 6 authorization.

## Permanent check

The release request names either a shared Client OS check for a cross-client
root cause or a client Test Library entry for a client-specific root cause.
The request cannot honestly close without that named permanent check.

## Permissions needed for pilot proof

Prompt 6 needs written Lilly authorization for: a non-client or selected pilot
project; read access to its saved/live project; candidate creation and exact
live write; account-level Skill comparison if relevant; the client Drive
Release Record location; the Client Update Board card; and any other provider
credentials. No email or Sunday schedule is needed for this phase.
