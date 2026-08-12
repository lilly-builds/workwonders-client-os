---
record_type: Project Register
required_fields: [project_id, project_label, claude_account, source_list, saved_copy_location, project_purpose, status, owner, trusted_source_reference]
allowed_statuses: [active, paused, archived]
---
# Project Register

- Project ID: [required: unique local project ID]
- Project label: [required: local label or placeholder]
- Claude account: [required: account label only; never credentials]
- Source list: [required: trusted source IDs]
- Saved-copy location: [required: approved local path or link reference]
- Project purpose: [required: plain-language purpose]
- Status: [required: active, paused, or archived]
- Owner: [required: person or role]
- Trusted source reference: [required: approved source record]
