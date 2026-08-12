---
record_type: Troubleshooting Card
required_fields: [card_id, question, current_answer, likely_causes, tests_attempted, results, ruled_out_causes, remaining_theories, check_method, evidence_reference, status, checked_by, checked_on, next_owner, next_action]
allowed_statuses: [not checked, checking, blocked, passed]
---
# Troubleshooting Card

- Card ID: [required: unique local ID]
- Question: [required: one checkable question]
- Current answer: [required: fact, assumption, or not known]
- Likely causes: [required: theories to test]
- Tests attempted: [required: tests already run or none]
- Results: [required: observed results]
- Ruled-out causes: [required: causes excluded by evidence or none]
- Remaining theories: [required: possible causes still open or none]
- Check method: [required when passed: repeatable check]
- Evidence reference: [required: source or test, or explicitly not available]
- Status: [required: not checked, checking, blocked, or passed with evidence]
- Checked by: [required when passed: person or role]
- Checked on: [required when passed: YYYY-MM-DD]
- Next owner: [required: person or role]
- Next action: [required: one specific action]
