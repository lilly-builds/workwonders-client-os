# Debug client project — implementation note

## Implemented

- **Command entry point:** `skills/debug-client-project/SKILL.md`. It gives
  `/debug-client-project` a one-question-at-a-time conversation contract and
  ends with known, unknown, owner, and next action. It gathers only the initial
  plain-language problem description; it does not create or update a Project
  Register.
- **Reusable material:** `templates/troubleshooting/` has all ten blank record
  shapes; `rules/troubleshooting-shared-rules.md` contains shared safety rules.
- **Required fields:** every template declares `required_fields`. A `passed`
  result needs a check method, evidence reference, checker, and check date.
- **Safety checks:** the fake-data validator rejects missing required fields,
  duplicate record IDs, invalid statuses, uncheckable passes, missing rollback
  actions, missing project IDs, and incomplete test records. It refuses to
  write a dry run inside this repository.

## Locally tested

- `npm test --prefix tools/troubleshooting-foundation`
- `npm run dry-run --prefix tools/troubleshooting-foundation -- --out <empty-local-folder>`
- `claude plugin validate .`
- `claude --plugin-dir . -p '/debug-client-project' --tools '' --no-session-persistence --max-budget-usd 1.00`
  loaded the local plugin and returned the required opening question.

Repository-provided checks were also inspected and run. The existing sync-tool
package has no `test` script: `npm test --prefix tools/claude-project-sync`
returned `Missing script: "test"`. Its JavaScript files were syntax-checked
instead with `node --check`.

The dry run creates ten files, each clearly labelled fictional local test data.

## Unverified

- Plugin discovery was proven once through Claude Code's temporary local plugin
  loader. A normal installed-plugin session, a plugin update, and a restart
  have not been tested.
- Template use and record creation are not yet proven inside a real Claude Code
  conversation.
- The existing `tools/claude-project-sync` package has no `test` script, so no
  repository-provided automated sync-tool test exists to run.
- No Drive, Basecamp, Claude Projects, email, or live client data was accessed.

## What Prompt 2 may build next

Prompt 2 may add a safe local Drive-synced-folder adapter around these records,
outside this repository's reusable-material boundary. Later phases may collect
an approved saved-copy path and write it to the Project Register. They must
preserve required fields, the checkable-`passed` rule, the fictional-fixture
label, and the repository-write guard. They must not create a Drive folder or
put client-specific material in this repository.
