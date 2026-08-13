# `/debug-client-project` Phase 3 handoff

## Status: engine locally verified, Claude conversation wiring not yet implemented

Phase 3 has two separate pieces:

1. **Investigation engine and CLI runner — locally verified.** The runner
   accepts all answers as command-line options, reads a sanitized fake saved
   copy, writes the records, and prints the summary.
2. **Claude Code conversational skill — not implemented.** The skill contains
   the approved language and question order, but no Claude Code hook currently
   passes conversation answers into the runner. `guidedQuestions()` returns
   prompt text only.

Therefore the full user path is **not claimed implemented**. No real Claude
Code invocation has proven the required start → questions → answers → run →
records → summary path.

The local investigation runner takes a fake saved-project JSON file and a
plain-language complaint. It identifies the fictional client/project, states
what it is checking, tests up to five original likely causes in order, adds at
most two evidence-led causes, and stops with a clear next owner.

Every run writes exactly one canonical Issue & Fix Log record and one canonical
Troubleshooting Card, with links to the project register, report names, and
saved-copy pointer. It also writes a Health Report. A proven data cause writes
a named-owner Data Integrity Report with the missing/wrong/conflicting data,
plain-language impact, exact correction, and recheck step. An unresolved case
writes a Developer Ticket with every test, its evidence, ruled-out causes, and
remaining theories.

## Fake scenarios and invocation

Fixtures are in `tests/fixtures/saved-projects/`:

- `client-complaint-rule.json`: complaint; project-rule cause proven.
- `data-cause.json`: data cause proven; named-owner report created.
- `missing-decision.json`: waits on a business decision owner.
- `unresolved-originals.json`: no clear cause; developer ticket created.
- `unresolved-new-causes.json`: two evidence-led causes; stop rule enforced.

Create the temporary Control Center through Phase 2, then run:

```text
npm run debug --prefix tools/debug-client-project -- --mode fake \
  --control-center /tmp/Client-Control-Center \
  --saved-copy tests/fixtures/saved-projects/data-cause.json \
  --client "Fictional Harbor Co" --project-id PROJECT-FAKE-001 \
  --project-name "Fictional Margin Helper" --issue-id ISSUE-FAKE-100 \
  --complaint "The expected margin answer is different from the result." \
  --client-owner "Fictional finance owner"
```

The runner only accepts the saved-copy path. It does not find, copy, read, or
verify a live Claude Project. No Basecamp, cloud schedule, email, connector,
browser profile, or live update is implemented.

## Phase 4/5 handoff: conversation wiring

The next implementation must add a real Claude Code skill entry point that:

1. Starts with the plain-language introduction.
2. Asks for client/project, complaint, saved-copy pointer, and issue ID one at
   a time, waiting for each answer.
3. Validates the project ID against the temporary Control Center and the saved
   copy before running.
4. Calls `investigate(input)` using the collected answers.
5. Displays the investigation result and the four required ending sections.
6. Has an end-to-end test using the actual supported Claude Code invocation,
   not just a direct module call or an argument-complete CLI run.

Until that exists and is tested, report the CLI runner and conversational
skill separately. Preserve fake-data-only input and the no-live-update rule.

## Canonical interfaces and boundaries

- `guidedQuestions()` returns the one-question-at-a-time prompts.
- `loadFakeSavedCopy(path)` reads a sanitized fixture with `project_id` and
  ordered `checks`.
- `planDeepCheck(savedCopy)` returns ordered causes, prove/disprove text,
  evidence, results, root cause, and stop reason.
- `investigate(input)` writes canonical records through the Phase 2 adapter and
  returns the evidence packet and plain-language summary.

Implemented cause categories are project rule, data, business decision, and
developer/tool or saved-copy boundary. The test-runner boundary is the fake
saved-copy JSON `checks` list. Real Claude responses, live sources, account
settings, and connectors remain unverified by design.

## Verification

```text
npm test --prefix tools/troubleshooting-foundation
node --test tests/troubleshooting-folder.test.mjs
node --test tests/debug-client-project.test.mjs
```
