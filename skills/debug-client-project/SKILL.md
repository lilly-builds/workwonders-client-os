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
- You may ask for an **approved local path or link reference** to a saved copy
  after the problem is clear. Record it only as a pointer in the Project
  Register; do not open the link, inspect the location, or copy its contents.
  The person running the workflow remains responsible for choosing the approved
  local working area.

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

When a pointer to the approved saved copy is needed, ask only:

> Where is the approved saved copy for this project? Share a local path or link
> reference only. Please do not paste client information or credentials here.

The current foundation gets its context from the person's plain-language
description and, when supplied, that pointer. It does not retrieve or verify
anything at the pointer. A future approved adapter may use it outside this
repository's reusable-material boundary.

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
