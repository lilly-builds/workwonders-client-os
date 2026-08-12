# Debug client project — implementation note

## Implemented through Phase 2

- **Phase 1 foundation:** `skills/debug-client-project/SKILL.md` provides the
  one-question-at-a-time intake contract, shared rules, blank record shapes,
  and the checkable-evidence rule for any `passed` result.
- **Phase 2 folder adapter:** `tools/troubleshooting-folder` creates and
  validates a local `Client Project Control Center` at an explicit absolute
  path. It creates the agreed core files and folders, and can write fake or
  explicitly approved project, issue, report, and release records.
- **Duplicate protection:** setup and validation detect duplicate project,
  issue, health-report, and release IDs regardless of filename. A changed or
  malformed existing record stops setup with a conflict instead of being
  silently reused.
- **Canonical records:** generated Project Register, Issue & Fix Log, Health
  Report, and Release Record files use the exact Phase 1 `record_type` values
  and include every required template field. Tests run their generated
  front matter through the Phase 1 validator.
- **Saved-copy boundary:** a saved-copy value is only a caller-supplied
  pointer. The adapter does not find, copy, read, or verify a Claude Project
  backup.

## Setup and validation commands

For local tests, use fake names and an output folder outside the repository:

```text
npm run setup --prefix tools/troubleshooting-folder -- \
  --mode fake \
  --out /absolute/path/to/Client\ Project\ Control\ Center \
  --client "Fictional Harbor Co" \
  --project-id PROJECT-FAKE-001 \
  --project-name "Fictional Margin Helper"

npm run validate --prefix tools/troubleshooting-folder -- \
  /absolute/path/to/Client\ Project\ Control\ Center
```

`--mode fake` labels generated records as fictional local test data. A future
approved client-folder run must use `--mode approved`; that mode never labels
the records as fictional and still does not prove Drive sync, permissions, or
the contents of any saved copy.

## Tests passed

- `npm test --prefix tools/troubleshooting-foundation` — 11 Phase 1 tests.
- `node --test tests/troubleshooting-folder.test.mjs` — Phase 2 setup,
  validation, duplicate, conflict, path-safety, and label-boundary tests.
- `claude plugin validate .` — passed with the repository's two existing
  manifest warnings.
- A temporary-folder smoke test created the exact expected layout, validated
  it, and confirmed no repository files were written.

The existing `tools/claude-project-sync` package still has no test script. No
Drive, Basecamp, Claude Projects, email, or live client data was accessed.

## Unverified

Real Google Drive desktop sync, shared-folder permissions, and the final
approved Drive location remain unverified. The adapter deliberately accepts a
local path only; it does not connect to Drive or create a cloud folder.

## Prompt 3 handoff

Prompt 3 should build the guided investigation against this folder contract
and saved-copy fixtures. It may read approved saved-copy fixtures and write
linked investigation records into the Control Center. It must not implement
Basecamp, a live Claude pull, or cloud scheduling in that step.
