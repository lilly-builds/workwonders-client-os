---
record_type: Release Record
required_fields: [release_id, change_summary, included_records, verification_status, check_method, checked_by, checked_on, evidence_reference, approver, release_date, rollback_action]
---
# Release Record

- Release ID: [required: unique local ID]
- Change summary: [required: plain-language change]
- Included records: [required: issue, ticket, and test IDs]
- Verification status: [required: not checked, blocked, needs review, or passed with evidence]
- Check method: [required when passed: repeatable check]
- Checked by: [required when passed: person or role]
- Checked on: [required when passed: YYYY-MM-DD]
- Evidence reference: [required: check result or report]
- Approver: [required: person or role]
- Release date: [required: YYYY-MM-DD]
- Rollback action: [required: safe reversal or why no release occurred]
