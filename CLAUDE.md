# WorkWonders Client OS — project context

Read this before working in this repo. The README says what the tool does; this
says why it exists and what has already been decided.

Last updated: 18 August 2026.

---

## The engagement

Jim West runs WorkWonders. He builds Claude projects for restoration and
remodeling companies (Patriot Restoration, Semper Fi Custom Remodeling) that
pull live data from their job software through connectors. Lilly was hired to
take over and streamline that work because it does not scale: Jim personally
does every build and every fix.

Basecamp, project "Lilly" (`48267142`):

- [Automating + Streamlining Claude Project Setup](https://app.basecamp.com/5730006/buckets/48267142/todolists/10174920714) — the umbrella
- [Claude Projects Troubleshooting](https://app.basecamp.com/5730006/buckets/48267142/todos/10174448479) — the ballpark project, Jim's own description of the loop, two call transcripts, and a Claude-generated recap Jim commissioned
- [Data Hygiene](https://app.basecamp.com/5730006/buckets/48267142/todos/10159897995) — "probably 12 hours this past weekend"
- [RestoreOps Onboarding and Automation](https://app.basecamp.com/5730006/buckets/48267142/todos/10160054964) — where Jim wants it to end up

The four core RestoreOps projects are **Owner Intelligence, Carrier
Collections, Margins Per Job, PM / Field**. They are four different tools for
one client, not four variants of one thing. The template axis is the *client*:
Patriot's Owner Intelligence and Semper Fi's Owner Intelligence are the same
tool pointed at two businesses.

---

## The actual problem

Not project setup. The **troubleshooting loop**. Jim described it himself in
the Ballpark to-do:

1. Live call with the client, running test prompts in the real Claude project
2. Screenshot the output, a dozen-plus images, paste into a *second* Claude chat
3. That chat re-checks the numbers against live job data
4. Clarifying questions go to the client by email, wait, upload the answers
5. Revised instructions and knowledge files come back, upload them by hand
6. Ask for test prompts, run them, screenshot, back to step 2

He maxes out image uploads. Chats hit their limit and he starts a new one.
**Screenshots are the API.**

Root causes, from `Ballpark Project Creation Session Recap.docx` attached to
that to-do. **Provenance matters here:** Jim's comment posting it says "I asked
Claude to generate a recap of the project rebuild and troubleshooting." So it is
a Claude-written analysis that Jim commissioned and endorsed by sharing, not
Jim's own account. It lists six, grouped below into four:

- **JobTread's data model defeats naive assumptions.** A line item or vendor
  name does not identify a trade; only the cost code does. "Rough In - Trade
  Work" is reused across plumbing and electrical. A vendor called "Drywall &
  Painting Contractor" also does tile. Learned live, by trial and error.
- **Document-level duplication.** A full duplicate set of cost groups exists
  per attached document, so naive summing inflates totals 2-6x. Rediscovered
  every time a new query pattern is built.
- **Ambiguous instruction wording caused real bugs.** "Sum every approved X and
  Y document" was read as adding two sources that were the same total seen two
  ways, and every figure came back double. Not a data problem, a wording one.
- **Flagged fixes get lost, and fixes do not propagate.** Seth's relocation
  "delete" fix was identified, written down as "will build this," and missed
  for three version cycles until Jim asked directly. Separately, filename
  references break on rename, and a fix on Semper Fi never reaches Patriot.

The no-regression-suite point is Jim's own, from the RestoreOps to-do: "takes
hours of checking and rechecking. You have to run new outputs over and over
until it's trustworthy."

One sentence: **every skill's trustworthiness is established by hand, and
re-established by hand, forever.**

---

## Why this repo exists, and why it came first

Lilly could not see the projects. They live across Jim's personal Claude Pro,
client accounts, and WorkWonders. He cannot share a chat. Nothing could start
until the projects existed as files.

This repo makes a Claude project into files: pull it down, version it, change
it, push it back, and prove the live project matches what you meant.

**It is not the fix for the troubleshooting loop.** It is the access problem
standing in front of it. The loop still needs a verification harness, and that
is the next real piece of work.

---

## Decisions already made, and why

**Drive claude.ai's internal web API, not the UI.** Discovered by watching what
the site itself requests, never by guessing endpoint names. The UI approach was
tried first (see the July Playwright scripts) and broke on selectors; the API
gives file *contents*, which the DOM never exposed. Undocumented and could
change, but it fails loudly rather than half-writing a project. ToS is
unverified: worth asking Anthropic before this becomes part of a paid offering.

**Pull and push stay separate commands.** A one-button clone that dies halfway
leaves a half-built project and no way to know which half landed.

**No delete, anywhere.** Deleting a project is a single call with no
confirmation. Too easy to point at the wrong one. Do not add it.

**Client data and browser profiles live outside the repo.** Installing a plugin
from a local folder copies the entire folder; an early install put live
claude.ai session cookies and client financials into the plugin cache. Profiles
now live in `~/.claude-project-sync/profiles`.

**The skill is instructions, not a script.** So Claude adapts it to Windows
and explains failures in plain language instead of showing Jim a stack trace.

**Distribution is a plugin from a private GitHub repo.** Jim is on Windows, has
never used a terminal or GitHub, and cannot be handed a folder to maintain.

---

## Gotchas, all found the hard way

- **Claude Code and Claude are different apps** with separate plugin systems.
  Installing in one and running the command in the other is the most likely
  first failure.
- **A newly installed or updated plugin needs a restart.**
- **Update greys out** until the marketplace list is refreshed; it looks like
  nothing new is available.
- **`docs_count` from the project list endpoint is wrong.** It reported 0 for
  projects holding 17 files. `list.mjs` no longer shows it.
- **Requests run inside a browser page.** If that page navigates or someone
  refreshes it, in-flight requests die. Scripts now open their own tab.
- **Uploads append, never replace.** Through the UI, a correct sync is remove
  all then upload all. Through the API we replace one file precisely, which is
  why push only touches what differs.
- **A project can hold two files with the same name.** Never dedupe silently;
  the second is saved as `__dup2` and recorded.

---

## Where things stand

**Built and verified against real systems:**

- `export` (pull), `push`, `diff`, `clone`, `backup-all` with filters
- Skills `backup` (read-only) and `update` (writes)
- Plugin installs from the private repo and its skills load
- One folder layout, documented in `docs/FILE-STRUCTURE.md`, and both pull
  commands proven to produce it identically

Evidence, not assertion: exported knowledge files were byte-identical to their
originals; a cross-account clone was confirmed by re-reading the new project.

**Built and tested against fixtures only, never against a live system:**

- Skills `debug` and `review-change`
- 7 tool packages under `tools/`, 57 passing tests, 10 Drive record templates
- The Basecamp adapters. Read `docs/BASECAMP-BOARD-CONTRACT.md` before trusting
  them; it says plainly that they do not connect to Basecamp.

Do not describe the second group as working. Nothing in it has run against a
real Claude project, a real Basecamp card, or a real Drive folder, and
`docs/PROTECTED-PILOT-RUNBOOK.md` is still marked blocked pending written
authorization.

**Open:**

- **Never tested on Windows.** The first run should be a screen share, and Jim
  is on Windows.
- **The sync tool is not wired into the troubleshooting skills.** `export.mjs`,
  `clone.mjs` and `push.mjs` genuinely talk to claude.ai, and the staging and
  review logic in `tools/troubleshooting-operator/` is real, but nothing calls
  one from the other. `debug` and `review-change` contain
  no reference to the sync tool. This is the largest gap in the repo.
- **The Test Library is empty.** The structure exists in the client Drive folder;
  the questions do not. Nothing downstream can prove anything without it.
- **Skills and project conversations are not pulled.** The endpoints exist
  (`skills/list-skills`, `projects/{uuid}/conversations_v2`). Conversations
  matter most: Jim's exact complaint is that he cannot share a chat between
  accounts, which is what forces the screenshots.
- **Client data in a repo has not been agreed.** The `.gitignore` keeps it out,
  so this is not urgent, but it is Jim's call and it has not been asked.

Jim has repo access as a collaborator, so the older "Jim needs a GitHub
invitation" item is closed.

## What comes next

In rough order of value:

1. **A verification harness.** Test prompts plus expected answers per skill,
   run them, report pass or fail. This is the thing that kills "run it over and
   over until it's trustworthy," and it is the actual engagement.
2. **Pull conversations.** May remove the screenshot bridge entirely.
3. **Templates.** Needs two clients' versions of the same project to compare;
   currently only Patriot's exists locally.
4. **A fix register**, so a flagged fix cannot be dropped for three versions.

Jim's own idea, worth respecting: Claude Projects can run **code execution**,
and routing the math through it would remove a whole category of bug rather
than testing around it.

---

## How to work here

- Verify against the real thing. Every claim in this file that says "verified"
  was checked by reading data back, not by trusting a success message.
- Report failures before successes.
- Never commit client data or browser profiles. Check `git status` before
  committing, not after.
