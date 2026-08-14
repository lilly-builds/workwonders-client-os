# Protected pilot authorization checklist

**Status:** incomplete; no external configuration is authorized  
**Prepared:** 2026-08-13

This is the only configuration intake for Prompt 6. Do not fill it with
credentials. Record approval names, dates, scopes, and secret-location
references only. Keep the actual secrets in the approved provider vault.

## Required approvals

| Gate | Required confirmation | Owner | Status |
|---|---|---|---|
| Pilot scope | Pilot client or non-client project, limits, dates, and owner | Lilly | **Missing** |
| Drive | Exact folder, read/write scope, sync status, and sharing check | Lilly | **Missing** |
| Basecamp | Client Bug Board and Client Update Board access and approved card IDs | Lilly | **Missing** |
| Cloud runner | Provider, account, secret reference, schedule/timezone, cost ceiling | Lilly | **Missing** |
| Alerts | Lilly destination and failure/stale alert permission | Lilly | **Missing** |
| Claude Project | Non-client or real-client permission, exact project ID/name, read/write scope | Lilly | **Missing** |
| Microsoft email | Sender, recipient scope, approval for client-facing email | Lilly | **Missing / off** |
| Candidate | Candidate creation permission and cleanup decision | Lilly | **Missing / off** |
| Fresh review | Reviewer who inspected the reachable path | Fresh reviewer | **Pending** |
| Usability readout | Jim's plain-language readout | Jim | **Pending** |

## External configuration record

Complete only after written approval exists.

- Pilot scope:
- Approved project ID/name:
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

Stop before external configuration if any required row is Missing, if a
credential is not in an approved vault, if the project identity is unclear, or
if the proposed test would touch a client without explicit approval.
