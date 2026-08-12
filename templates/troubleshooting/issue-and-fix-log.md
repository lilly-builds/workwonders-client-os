---
record_type: Issue & Fix Log
required_fields: [issue_id, symptoms, proven_root_cause, solution, permanent_check, resolution_date, evidence_reference, impact, owner, status]
allowed_statuses: [open, in progress, blocked, resolved]
---
# Issue & Fix Log

- Issue ID: [required: unique local ID]
- Symptoms: [required: what was observed]
- Proven root cause: [required: confirmed cause or explicitly not yet proven]
- Solution: [required: change to make or why no change is safe]
- Permanent check: [required: repeatable check that prevents recurrence]
- Resolution date: [required: YYYY-MM-DD or explicitly not resolved]
- Evidence reference: [required: source or test that supports this record]
- Impact: [required: who or what is affected]
- Owner: [required: person or role]
- Status: [required: open, in progress, blocked, or resolved]
