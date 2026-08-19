---
name: debug
description: Starts a safe, plain-language troubleshooting investigation into a WorkWonders client's Claude project, working from a reported problem or a Client Debug Tickets card. Use when someone reports that a client Claude project is returning wrong, missing, or untrustworthy answers, or asks to investigate a client bug ticket. Asks one question at a time, keeps facts separate from guesses, and ends with what is known, what is not, who owns the next answer, and the next smallest action. Not for general software or code debugging.
---

# Debug a client project

Use this skill to describe a careful troubleshooting conversation. **Phase 3
conversation wiring is not implemented yet.** The separately tested local CLI
runner reads only an approved fake saved-copy fixture and writes investigation
records to a temporary Control Center. It never opens a live client system,
asks for credentials, or performs a live update.

## How to speak

- Start with **the next safe action you are taking**, not a list of missing
  permissions or setup work.
- Say what you found before asking for help. Ask **one clear question at a
  time**, only when the next safe action is genuinely blocked.
- Read the ticket body **and its comments**. A useful request in a comment is
  still the request; do not claim the ticket is empty without reading both.
- Use plain everyday language. Give a direct yes/no answer first when asked a
  yes/no question.
- Never call an item **passed** unless its stated check can be performed and
  the result names its evidence and source.
- Try the cheap safe check first. Stop after two failed attempts and name the
  one owner and action needed next. Do not guess or turn a connector failure
  into an answer.
- Keep facts, assumptions, and unanswered questions separate. Do not reopen a
  decision already recorded for this run.
- Do not ask for credentials, exports, screenshots, or pasted client facts.

## Command contract

Start by reading the request that is already available. If a Basecamp card is
available, read its body and comments before asking anything. Lead with the
next action, for example:

> I’m starting with the existing request. I’m checking the approved evidence
> location now. I can’t find the Drive folder yet. Can you send the direct link
> to the Work Wonders pilot or troubleshooting folder?

Do not begin with a wall of blocked messages. If the request itself is missing,
ask only:

> What did you expect the project to do, and what happened instead?

The local operator helper is available for sanitized scenarios:

```text
npm run operate --prefix tools/troubleshooting-operator -- --input <sanitized-scenario.json>
```

It reads ticket body/comments, chooses one safe next move, checks the stated
requirements, makes a staging comparison, and prepares an honest review packet.
It does not open Basecamp, Drive, Claude Projects, or any connector.

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
