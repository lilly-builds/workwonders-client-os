---
name: debug-client-project
description: Start a safe, plain-language troubleshooting check for a Claude client project. Use when someone says "debug this client project", "troubleshoot a project", "something is wrong with the project", or asks for a structured investigation. This foundation uses reusable blank records only and never connects to a live client system.
---

# Debug a client project

Use this skill to describe a careful troubleshooting conversation. **Phase 3
conversation wiring is not implemented yet.** The separately tested local CLI
runner reads only an approved fake saved-copy fixture and writes investigation
records to a temporary Control Center. It never opens a live client system,
asks for credentials, or performs a live update.

## How to speak

- Use plain language. Explain what is happening before asking for input.
- Ask **one clear question at a time**. Wait for the answer before asking the
  next question.
- Never call an item **passed** unless its stated check can be performed and
  the result is recorded with evidence.
- Keep facts, assumptions, and unanswered questions separate.
- Do not ask for credentials, exports, screenshots, or pasted client facts.

## Command contract

Start with:

> I will help you sort out the project safely. I will ask one question at a
> time, explain what I am checking, and finish with what we know, what we do
> not know, who owns the next step, and what happens next. This first step uses
> blank reusable records only; it will not connect to a client system.

When this skill is connected to a supported interactive command, ask only this
first question:

> What is the one thing you expected this project to do, and what happened
> instead?

After each answer, briefly say what it means and ask the single next question
that is necessary to clarify the problem. Use the templates in
`templates/troubleshooting/` as the blank record shapes and
`rules/troubleshooting-shared-rules.md` for safety lessons.

The Phase 3 CLI runner accepts all answers as command-line options supplied by
the caller; it is not currently connected to this conversation text. It
reads a sanitized fake JSON copy, checks likely causes in order, records
evidence, and writes one Issue & Fix Log record, one Troubleshooting Card, and
a linked Health Report. A proven data cause also writes a named-owner Data
Integrity Report; an unresolved case writes a Developer Ticket. The pointer is
never treated as proof that a backup was found, copied, or verified.

Example invocation:

```text
npm run debug --prefix tools/debug-client-project -- --mode fake \
  --control-center /tmp/Client-Control-Center \
  --saved-copy tests/fixtures/saved-projects/client-complaint-rule.json \
  --client "Fictional Harbor Co" --project-id PROJECT-FAKE-001 \
  --project-name "Fictional Margin Helper" --issue-id ISSUE-FAKE-100 \
  --complaint "The expected margin answer is different from the result."
```

Any proposed reusable check is only prepared in the record. A live change
still needs a preview and a direct yes/no approval from Lilly, and this phase
never performs it.

Do not claim the complete conversational user path is implemented until an
actual Claude Code invocation proves that it starts, asks these questions in
order, receives the answers, runs the investigation, writes the records, and
shows the plain-language summary. The Phase 4/5 handoff is documented in
`docs/DEBUG-CLIENT-PROJECT-PHASE3.md`.

The templates are reference material for the future workflow. Their use and
record creation have not yet been proven inside a real Claude Code conversation.

## Future workflow, not built here

The finished workflow is intended to gather the problem, test likely causes,
propose a fix, get Lilly's approval, apply a safe update, retest the original
problem, check that nothing else broke, and document the result. This skill
only establishes the intake, record shapes, safety rules, and evidence bar for
that future work.

## Finish every session

End with exactly these four headings, even when the investigation cannot move
forward yet:

### What we know
- [Facts that were observed or checked]

### What we do not know
- [Questions still open, assumptions, or checks not yet possible]

### Next owner
- [Person or role responsible for the next action]

### Next action
- [One specific, safe action and when it should happen]

If no checkable evidence exists, say so plainly. Do not infer a pass from a
reasonable-sounding answer, an empty result, or a missing record.
