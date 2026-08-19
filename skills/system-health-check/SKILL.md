---
name: system-health-check
description: Runs the scheduled health check on a WorkWonders client's Claude project. Reads that project's Test Library, runs every required question against a saved copy of the project, and writes a Health Report. If any required check fails it automatically starts a deep investigation into the first failure and records the issue. Use for the weekly Sunday check across active client projects, before and after a client project update, or when someone asks whether a client project is still healthy. Read-only: it never changes a live project.
---

# Check a client project's health

This is the **Detect** move. `/debug` starts after a client has reported a
problem. This one runs on a schedule so a problem is found before they have to.

It is read-only. It reads a saved copy of the project, never the live one, and
it never writes to Claude.

## How to speak

- Say which client and project you are checking before you check it.
- Report failures before successes.
- Never call a check **passed** unless its result names its evidence.
- End with what is known, what is not, who owns the next answer, and the next
  action.

## What you need before starting

Ask for anything missing, one question at a time.

| Needed | What it is |
| --- | --- |
| Client and project | Which client, and which of their projects |
| Control Center folder | That client's folder in the shared Drive evidence home |
| Saved copy | A recent pull of the project, not the live project |
| Test Library | The questions this project must answer, from sheet `04 Test Library` |

If the Test Library has no entries for this project, **stop and say so.** A
health check against an empty Test Library proves nothing. It is not a pass.

## Running it

```bash
npm run check --prefix tools/check-client-project -- \
  --mode fake \
  --control-center "<client Control Center folder>" \
  --saved-copy "<saved copy file>" \
  --test-library "<test library file>" \
  --client "<client name>" \
  --project-id "<exact project id>" \
  --project-name "<project name>"
```

**Every path must be absolute.** `npm run --prefix` resolves relative paths
against the tool's own folder, not the folder you are standing in, so a
relative path fails with a confusing "no such file or directory" pointing at
`tools/check-client-project/`. If you see that error, the paths were relative.

`--mode fake` runs against fixtures. Do not change it until a live saved-copy
path has been approved for this client.

The Control Center folder must be **outside the repository**. The command
refuses to write inside it and says so.

## Reading the result

Two outcomes, and they mean different things.

**`healthy`** — every required check passed. A Health Report is written to the
Control Center. No further work is created. Say plainly what was *not* covered:
the live Claude project, Basecamp, Drive, the cloud runner, and email are not
checked by this command.

**`needs review`** — at least one required check failed. The command
automatically opens a deep investigation into the **first** failed test and
writes an issue record. Report:

1. Which checks failed, and the evidence for each
2. That a deep check was started, and on which failure
3. That the remaining failures still need their own investigation
4. Who owns the next answer

## The rule that matters

A required test with **no result** in the saved copy counts as **failed**, not
skipped. A check is never turned into a pass by checking less, dropping a
source, or lowering the standard. If a check could not run, it stays visible as
waiting on data, waiting on a decision, or needing development work.

## What this does not do

- It does not touch the live Claude project.
- It does not fix anything. A failure produces an investigation and an owner.
- It only deep-checks the first failure. Remaining failures need to be worked
  separately.
- It does not send email or move a Basecamp card.
