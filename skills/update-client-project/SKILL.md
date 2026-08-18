---
name: update-client-project
description: The only approved front door for a controlled Client OS project update.
---

# `/update-client-project`

This command is the single update front door **for a client project**. It does
not write to Claude itself. The writing is done by `update-claude-project`,
which holds the mechanics: the dry-run preview, the plain-language plan, the
named list of files that would be removed, and the read-back that proves the
live project matches what was approved.

Two commands, two jobs, one writer:

| | `update-client-project` (this one) | `update-claude-project` |
|---|---|---|
| Job | Decides whether a change is allowed to happen | Makes the change happen |
| Holds | Approval, staging rules, checks, the release record | The push, clone, and read-back steps |
| Use it for | Any change to a live client project | The transport step this command calls, or a non-client folder push |

Use this command for client work. It calls the other one to do the write, after
the controls below have passed. Do not run `push.mjs` or `clone.mjs` by hand for
a client project: doing so skips the approval, the candidate test, and the
release record.

It requires an exact existing project ID, a named target, a visible preview,
and Lilly's explicit approval before any write. It updates existing files only:
new files, duplicates, unexpected items, wrong IDs, and missing components stop
the run.

When cloning is supported, the candidate must be named exactly:
`STAGING — [live project title]`. It is linked to the source live ID, tested,
reviewed by Lilly, and promoted by approved file list only. The whole candidate
is never copied blindly.

The promotion packet belongs in the client Drive release record and is linked
from the approved Client Updates card:
https://app.basecamp.com/5730006/buckets/48267142/card_tables/10197329775

The behavior set asks the original problem question, the five safety questions
(correct source, all relevant pages, cost-code use, denied-bill exclusion,
cost-versus-price separation), and `Does anything else look off?`. The last is
a discovery signal and requires human review; it is not a standalone pass/fail.

Account-level Skills are `not checked` unless they can be compared and tested
in both candidate and live. Do not claim full verification without that proof.

This phase uses sanitized fixtures or a mocked transport only. No client update,
email, or Sunday check is activated.
