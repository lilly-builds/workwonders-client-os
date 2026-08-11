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

This foundation does not connect to client systems or create client records.

## Blank records and required fields

The ten record shapes are in `templates/troubleshooting/`. Each declares its
own `required_fields` list in its header. The validator rejects a fake or
future local record that omits one of those fields.

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
data. The output is only test output; delete it after inspection.

## Prompt 2 handoff

See the short [implementation note](DEBUG-CLIENT-PROJECT-IMPLEMENTATION-NOTE.md).
