---
record_type: Release Record
required_fields: [release_id, target_project_id, change_summary, approved_file_list, included_records, verification_status, check_method, checked_by, checked_on, evidence_reference, post_update_comparison_result, client_email_required, approver, release_date, rollback_action]
allowed_statuses: [not checked, blocked, needs review, passed]
---
# Release Record

- Release ID: [required: unique local ID]
- Target project ID: [required: exact project ID]
- Change summary: [required: plain-language change]
- Approved file list: [required: exact files approved for update]
- Included records: [required: issue, ticket, and test IDs]
- Verification status: [required: not checked, blocked, needs review, or passed with evidence]
- Check method: [required when passed: repeatable check]
- Checked by: [required when passed: person or role]
- Checked on: [required when passed: YYYY-MM-DD]
- Evidence reference: [required: check result or report]
- Post-update comparison result: [required: matched, mismatched, or not run]
- Client email required: [required: yes or no]
- Approver: [required: person or role]
- Release date: [required: YYYY-MM-DD]
- Rollback action: [required: safe reversal or why no release occurred]
