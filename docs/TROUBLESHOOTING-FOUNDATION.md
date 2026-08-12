# Troubleshooting foundation

## Repository boundary

This repository contains reusable material only: blank templates, shared
rules, plain-language instructions, structural checks, and sanitized fictional
fixtures. It must not contain client facts, data exports, screenshots,
credentials, browser profiles, or copies of a live project. Future work that
needs client-specific records belongs in an approved local working area, not
here.

## Command entry point

The plugin exposes `/debug-client-project` through
`skills/debug-client-project/SKILL.md`. Its contract is deliberately small:
say what is happening, ask one clear question at a time, and end with **What we
know**, **What we do not know**, **Next owner**, and **Next action**.

This foundation does not connect to client systems or create client records. It
gets context only from the person's plain-language description. Later phases
may collect an approved saved-copy path and write it to the Project Register.
This foundation does not open, read, or write client records.

## Blank records and required fields

The ten record shapes are in `templates/troubleshooting/`. Each declares its
own `required_fields` list in its header. The validator rejects a fake or
future local record that omits one of those fields.

The templates are blank reference material in this phase. Template use and
record creation have not yet been proven inside a real Claude Code conversation.

For any record that uses `passed` as its status, the validator also requires:

- `check_method`
- `evidence_reference`
- `checked_by`
- `checked_on`

This prevents a template or report from treating an uncheckable statement as a
pass.

## Local checks

Run the focused structural tests:

```bash
cd tools/troubleshooting-foundation
npm test
```

Run the fake-data dry run in an empty temporary folder:

```bash
cd tools/troubleshooting-foundation
npm run dry-run -- --out /tmp/workwonders-troubleshooting-dry-run
```

The dry run creates all ten named reusable records with fictional local test
data. Each generated file starts with a clear fictional-data label. The command
refuses any output folder inside this repository, preventing an accidental
write of fake records into reusable material. The output is only test output;
delete it after inspection.

Plugin discovery was also checked locally by loading this folder as a temporary
Claude Code plugin and invoking `/debug-client-project`. It returned the
required opening question. This does not prove an installed plugin will survive
an update or restart.

## Future workflow, not built here

The finished `/debug-client-project` workflow is expected to gather the
problem, test likely causes, propose a fix, get Lilly's approval, apply the
safe update, retest the original problem, check that nothing else broke, and
document the result. This foundation implements only the safe conversation
contract, reusable blank records, shared rules, and structural checks. It does
not connect to Drive, Basecamp, Claude Projects, email, or live client data.

## Prompt 2 handoff

See the short [implementation note](DEBUG-CLIENT-PROJECT-IMPLEMENTATION-NOTE.md).
