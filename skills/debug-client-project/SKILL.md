---
name: debug-client-project
description: Start a safe, plain-language troubleshooting check for a Claude client project. Use when someone says "debug this client project", "troubleshoot a project", "something is wrong with the project", or asks for a structured investigation. This foundation uses reusable blank records only and never connects to a live client system.
---

# Debug a client project

Use this command to start a careful troubleshooting conversation. This is the
foundation only: it does not open a client system, create a client record,
read exports, use screenshots, access credentials, or use a browser profile.

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

Then ask only this first question:

> What is the one thing you expected this project to do, and what happened
> instead?

After each answer, briefly say what it means and ask the single next question
that is necessary to clarify the problem. Use the templates in
`templates/troubleshooting/` as the blank record shapes and
`rules/troubleshooting-shared-rules.md` for safety lessons.

The current foundation gets context only from the person's plain-language
description. It does not retrieve, verify, save, or update client context.
Later phases may collect an approved saved-copy path and write it to the
Project Register. This foundation does not open, read, or write client records.

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
