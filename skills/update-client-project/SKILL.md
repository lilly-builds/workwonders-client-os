---
name: update-client-project
description: The only approved front door for a controlled Client OS project update.
---

# `/update-client-project`

This command is the single update front door. It **wraps the existing
`update-claude-project` sync tool** as a transport primitive; it does not add a
second writer. The old skill is a backwards-compatible redirect to this one.

It requires an exact existing project ID, a named target, a visible preview,
and Lilly's explicit approval before any write. It updates existing files only:
new files, duplicates, unexpected items, wrong IDs, and missing components stop
the run.

When cloning is supported, the candidate must be named exactly:
`STAGING — [live project title]`. It is linked to the source live ID, tested,
reviewed by Lilly, and promoted by approved file list only. The whole candidate
is never copied blindly.

The promotion packet belongs in the client Drive release record and is linked
from the approved Client Update Board card:
https://app.basecamp.com/5730006/buckets/48267142/card_tables/10197329775

The behavior set asks the original problem question, the five safety questions
(correct source, all relevant pages, cost-code use, denied-bill exclusion,
cost-versus-price separation), and `Does anything else look off?`. The last is
a discovery signal and requires human review; it is not a standalone pass/fail.

Account-level Skills are `not checked` unless they can be compared and tested
in both candidate and live. Do not claim full verification without that proof.

This phase uses sanitized fixtures or a mocked transport only. No client update,
email, or Sunday check is activated.
