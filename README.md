# WorkWonders Client OS

How we build, back up, and repeat client Claude projects.

A Claude project normally lives only inside claude.ai. You cannot read it as
files, copy it, diff it, or roll it back. That makes every project a one-off
build and every change a one-way door.

This turns a project into files: pull it down, keep it in version control,
change it, push it back, and prove the live project matches what you meant.

---

## What's here

| Folder | What it holds |
| --- | --- |
| `tools/claude-project-sync/` | The pull / push / diff / clone commands |
| `templates/` | Reusable project skeletons with the client details blanked out |
| `demos/` | Screen recordings of the workflow (videos are not committed) |
| `docs/` | Notes and decisions |

Two folders are deliberately **not** in the repo, see `.gitignore`:

- `exports/` holds pulled client projects, which contain real client financials.
- `profiles/` holds browser sessions, which contain live login cookies.

---

## Setup, once

```bash
cd tools/claude-project-sync
./bin/start-chrome.sh opterra      # port 9223
```

A separate Chrome window opens. Sign into Claude in it and leave it open.
It keeps its own login, so it never touches your everyday browser, and a second
account can run alongside it:

```bash
./bin/start-chrome.sh personal     # port 9224
```

---

## The commands

All of them take `--port` to choose which signed-in account to act as.

**See what an account can reach**

```bash
node src/list.mjs --port 9223
```

**Pull a project down to files**

```bash
node src/export.mjs --port 9223 --project <url-or-uuid>
```

Read-only. If an export is already there it asks whether to keep both, replace,
or cancel. It never silently overwrites a previous pull.

**Check whether the live project still matches disk**

```bash
node src/diff.mjs --port 9223 --project <url-or-uuid> --dir exports/<name>
```

This is the one that answers "is the live project actually running what I think
it is." Exits non-zero when they differ, so it can gate another step.

**Push changes back up**

```bash
node src/push.mjs --port 9223 --project <url-or-uuid> --dir exports/<name>
node src/push.mjs ... --dry-run    # show the plan and stop
```

Only touches what actually differs, so pushing one fix leaves everything else
alone. Afterwards it pulls the project back down and compares, and reports
success only if it genuinely matches.

**Create a new project from a folder**

```bash
node src/clone.mjs --port 9223 --dir exports/<name> \
  --name "Owner Intelligence" --org "WorkWonders"
```

Pull from one account, clone into another. That is how a project moves between
a client's Claude and ours.

---

## How it works, and the honest caveats

It drives claude.ai's own internal web API, the same requests the site makes,
authenticated by the browser profile's existing login.

- **Not an official API.** It is undocumented and Anthropic can change it. When
  that happens these commands fail loudly with a bad status code rather than
  half-writing a project.
- **Terms of service are unverified.** It only does things you are allowed to do
  by hand, on your own account, at human pace, with requests spaced out and
  backoff on any rate limiting. Worth a direct question to Anthropic before this
  becomes part of a paid offering.
- **Deleting projects is possible and deliberately not built in.** Too easy to
  point at the wrong project.

## What it does not do yet

- Skills and project conversations are not pulled (the endpoints are known).
- Non-text attachments are reported but not downloaded.
- Nothing here runs without a terminal, which matters because Jim does not use
  one.
