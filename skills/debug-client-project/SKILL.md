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
- Do not ask for credentials, exports, screenshots, or client facts in this
  foundation. If they are needed, say that the next approved workflow must
  collect them outside this reusable-material repository.

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
