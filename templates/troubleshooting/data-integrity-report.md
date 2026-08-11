---
record_type: Data Integrity Report
required_fields: [report_id, data_area, check_method, finding, evidence_reference, status, checked_by, checked_on, owner, next_action]
---
# Data Integrity Report

- Report ID: [required: unique local ID]
- Data area: [required: data being checked]
- Check method: [required: repeatable method]
- Finding: [required: observed result]
- Evidence reference: [required: source or test output]
- Status: [required: not checked, needs review, blocked, or passed with evidence]
- Checked by: [required when passed: person or role]
- Checked on: [required when passed: YYYY-MM-DD]
- Owner: [required: person or role]
- Next action: [required: one safe action]
