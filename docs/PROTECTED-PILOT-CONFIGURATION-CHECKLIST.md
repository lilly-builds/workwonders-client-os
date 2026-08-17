# Protected pilot authorization checklist

**Status:** incomplete; no external configuration is authorized  
**Prepared:** 2026-08-13

This is the only configuration intake for Prompt 6. Do not fill it with
credentials. Record approval names, dates, scopes, and secret-location
references only. Keep the actual secrets in the approved provider vault.

## Required for the basic protected pilot

The basic pilot is one approved non-client or test project with one Client Bug
Board triage card, a local/manual trigger, no email, no live update, no cloud
schedule, and read-only source access wherever possible. The pilot must pull
the card, respond on the same card, and prove the stage change without creating
a duplicate. The run must happen through the Claude environment, not a
shell-only command. Only the rows below are needed to start that pilot.

| Gate | Required confirmation | Owner | Status |
|---|---|---|---|
| Pilot scope | One approved non-client or test project, limits, dates, and owner | Lilly | **Missing** |
| Saved-copy source | Read access to the approved saved copy and complete Test Library | Lilly | **Missing** |
| Claude environment | One named Work Wonders Claude account used by Claude Code; project access shared to that same account if needed; installed Client OS command and visible approval pauses. No prompt ferrying between browser and Claude Code. | Lilly + Jim | **Missing** |
| Connector readiness | Every connector named by the selected Test Library is configured for the approved pilot tenant or is explicitly excluded from the pilot. Record the owner of each fix. | Lilly + connector owner | **Missing** |
| Drive records | Exact folder and the smallest approved write scope for pilot records | Lilly | **Missing** |
| Bug Board | Read access plus permission to respond to and change stage on one approved pilot card; no Update Board access needed | Lilly | **Missing** |
| Fresh review | Reviewer who inspected the reachable path | Fresh reviewer | **Pending** |
| Usability readout | Jim's plain-language readout | Jim | **Pending** |

## Only required if optional paths are included

Leave these off for the recommended first pilot. Approve each separately.

| Optional path | Additional confirmation | Owner | Status |
|---|---|---|---|
| Cloud schedule | Provider, account, secret reference, Sunday schedule/timezone, cost ceiling, and disable action | Lilly | **Off** |
| Cloud alerts | Lilly destination and failure/stale alert permission | Lilly | **Off** |
| Live update | Exact live project access, candidate creation, candidate ID/name, and cleanup decision | Lilly | **Off** |
| Update Board | Client Update Board access and approved update card | Lilly | **Off** |
| Microsoft email | Sender, recipient scope, and approval for client-facing email | Lilly | **Off** |
| Claude Project | Exact non-client or real-client project ID/name and approved read/write scope | Lilly | **Off** |

## External configuration record

Complete only after written approval exists.

- Pilot scope:
- Approved project ID/name:
- Saved-copy location and read-only access confirmation:
- Claude Code account and project-sharing confirmation:
- Connector readiness results, expected tenant, and fix owner:
- Drive folder link or sanitized locator:
- Bug Board card ID:
- Update Board card ID, if applicable:
- Cloud provider and schedule:
- Alert destination:
- Live/candidate Claude Project IDs and names:
- Microsoft email allowed: yes / no
- Secret vault reference (not the secret):
- Approval record link:
- Expiry or cleanup date:
- Disable/rollback owner:

## Go/no-go signature

**Lilly decision:** ☐ Go  ☐ No-go  
**Lilly name:** ____________________  
**Date:** ____________________  
**Approval record:** ____________________

**Jim usability readout:**

________________________________________________________________________

________________________________________________________________________

## Stop conditions

Stop before external configuration if any row in the basic-pilot table is
Missing, if a credential is not in an approved vault, if the project identity
is unclear, or if the proposed test would touch a client without explicit
approval. Optional rows may remain Off when the optional path is excluded.
