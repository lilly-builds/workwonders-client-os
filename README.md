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
| `skills/` | `backup-claude-projects` and `update-claude-project`, for people who don't use a terminal |
| `tools/claude-project-sync/` | The pull / push / diff / clone commands |
| `templates/` | Reusable project skeletons with the client details blanked out |
| `templates/troubleshooting/` | Blank records for the safe troubleshooting workflow |
| `rules/` | Reusable safety lessons that apply to every troubleshooting run |
| `demos/` | Screen recordings of the workflow (videos are not committed) |
| `docs/` | Notes and decisions |

**This repo holds code only.** Working data lives outside it, on purpose:

- Pulled projects go wherever you point them, by default
  `../claude-project-data/exports`. They contain real client financials.
- Browser profiles live in `~/.claude-project-sync/profiles`. They contain live
  claude.ai login cookies.

Both are kept out because installing this as a plugin copies the whole repo
folder, and copying session cookies into a plugin cache is not acceptable.

## Troubleshooting foundation

`/debug-client-project` is a safe starting point for diagnosing a client
project. It asks one clear question at a time, says what it is doing, and ends
by separating what is known from what still needs checking. It creates or uses
only the blank reusable records in this repository; it does not connect to a
client system, create a client record, or open a browser profile.

See [the troubleshooting guide](docs/TROUBLESHOOTING-FOUNDATION.md) for the
record list, required fields, and local checks.

---

## For someone who doesn't use a terminal

Install it as a plugin and use the skill instead of the commands.

1. Install the Claude Code desktop app and sign in
2. **+ → Plugins → Add plugin**, and point it at this repo
3. Type `/backup-claude-projects`

The skill sets up its own folder, installs what it needs, opens a Chrome window
to sign into, and backs up every project the account can reach. It handles
several Claude accounts one after another, which matters when projects are
spread across a personal plan, a company account, and client accounts.

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
