# Operator-ready troubleshooting loop verification contract

## Product promise

A team member can begin a client bug or update request without receiving a wall
of setup warnings. The system reads the ticket body and comments, takes the
next safe action, asks one useful question only when it is genuinely blocked,
checks the stated requirements, and prepares an honest review packet.

## Verification tier

**Tier 3 — locally verified only.** This is a multi-stage agent workflow with
future Basecamp, Drive, Claude Project, and connector providers. This phase
builds and tests the reusable local decision layer. It does not connect any
provider or change a client project.

## Local entry path

`npm run operate --prefix tools/troubleshooting-operator -- --input <sanitized JSON>`

The command reads a sanitized local scenario and prints: ticket intake,
connector readiness, the next operator move, requirement-checklist summary,
staging comparison, and review-packet status. It performs no network request
and writes no client record.

## Required local subsystems and proof

| Part | Proof required now |
|---|---|
| Ticket intake | Reads both card body and comments; selects a useful request or asks one question. |
| Operator wording | Starts with the next action, uses plain wording, and exposes only one ask. |
| Connector gate | Checks only connectors named by the ticket; blocks a missing, broken, or wrong-tenant connector. |
| Requirement checker | Records pass, fail, partial, and not-tested results with evidence and source labels. |
| Staging planner | Preserves a baseline manifest, detects file/content drift, and requires explicit staging-skill routing. |
| Review packet | Separates what changed, passed, was not tested, and how to reverse the change. |

## Controls

- **Positive:** complete sanitized ticket, evidence home, ready connector,
  matching staging manifest, and passing requirements yields `ready for review`.
- **Negative:** empty card body with a useful comment is still usable; a missing
  evidence home, wrong tenant, or missing staging routing blocks safely.
- **Recovery:** after two failed attempts, the flow stops further automatic
  tries and names the next owner/action.
- **Regression:** a connector failure cannot be reported as a numbered answer
  or a passing requirement.

## Explicit exclusions

No live Basecamp, Drive, Claude Project, email, cloud schedule, browser
profile, credential, raw client output, or connector data is accessed in this
phase. Those remain blocked until the protected-pilot authorization is complete.
