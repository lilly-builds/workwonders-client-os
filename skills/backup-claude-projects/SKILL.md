---
name: backup-claude-projects
description: Back up Claude projects to files. Copies the custom instructions and every knowledge file out of claude.ai and onto disk, for one account or several, so projects can be read, compared, shared with teammates, restored, or reused as templates for a new client. Use when someone says "back up my Claude projects", "save my projects", "export my Claude project", "get a copy of my projects", "I need to see the projects in that account", or wants a project moved or copied between Claude accounts. Sets itself up on first run, including installing what it needs.
---

# Back up Claude projects

A Claude project normally lives only inside claude.ai. You cannot read it as
files, copy it, compare versions, or restore it. This pulls it out onto disk.

It is read-only against claude.ai unless the person explicitly asks to push or
clone. It cannot delete a project.

## Talk like a person

Whoever runs this may never have used a terminal. Never show a raw error or a
stack trace. Say what happened and what to do next, in one or two sentences.

Do not narrate the steps below. Do the work, ask only what you must, and report
at the end.

## Step 1: work out where things go

You need two folders. Ask once, in a single message, and offer defaults:

- **Where to save the backup.** Default to a cloud-synced folder if one exists
  (look for `Google Drive`, `Dropbox`, `OneDrive` in the home folder), because
  that shares the result with teammates automatically. Otherwise the Desktop.
- **Where to keep the tool itself.** Default to a `claude-project-backup`
  folder next to the backup folder.

If a previous run already recorded these in `.backup-config.json` in the tool
folder, reuse them and do not ask again.

## Step 2: make sure the tool is present

The tool is the `tools/claude-project-sync` folder from the
`workwonders-client-os` repo. If it is already in the tool folder, skip ahead.

If it is not, get it: clone the repo, or copy it from wherever it is bundled
with this skill. Then run `npm install` inside it.

Check Node is available (`node --version`, needs v18+). If it is missing, say
so plainly and offer to install it:

- macOS: `brew install node`, or download from nodejs.org
- Windows: `winget install OpenJS.NodeJS`

If installing is blocked (a locked-down work laptop), stop and say that IT
restrictions are blocking it. Do not try to work around it.

## Step 3: open a browser signed into Claude

The tool drives a real Chrome window with its own separate profile, so it never
touches the person's everyday browsing, and several Claude accounts can each
have their own.

Pick a short name for the account being backed up (`personal`, `workwonders`,
the client's name). Each name gets its own profile folder and its own port:
start at 9223 and add one for each additional account.

- **macOS**: run `./bin/start-chrome.sh <name>`
- **Windows**: launch Chrome directly with these flags, using a profile folder
  inside the tool folder:

  ```
  "C:\Program Files\Google Chrome\Application\chrome.exe" ^
    --remote-debugging-port=<port> ^
    --user-data-dir="<toolfolder>\profiles\<name>" ^
    --no-first-run --no-default-browser-check https://claude.ai/projects
  ```

  Chrome may also be under `Program Files (x86)` or the user's `AppData\Local`.
  Find it rather than assuming.

Then **stop and ask them to sign in** to that Claude account in the window that
opened, and to say when they are done. Never ask for a password and never type
credentials. Wait for them.

Confirm the sign-in worked before continuing:

```
node src/list.mjs --port <port>
```

If that reports it is not signed in, tell them the sign-in did not take and ask
them to try again in that same window.

## Step 4: show them what is there, and ask

Never back up everything without asking. A personal Claude account holds
personal projects, and this often writes into a folder that other people can
see. Sweeping those up would share private work with colleagues.

First, list without taking anything:

```
node src/list.mjs --port <port>
```

Show them the list grouped by organization and ask which to back up: all of
them, or only some. If any name looks personal rather than work, point at it
and ask specifically.

Then back up what they chose:

```
# everything
node src/backup-all.mjs --port <port> --out "<backup folder>"

# only certain projects (matches part of a name, case-insensitive)
node src/backup-all.mjs --port <port> --out "<backup folder>" --only "patriot,semper fi"

# everything except some
node src/backup-all.mjs --port <port> --out "<backup folder>" --exclude "personal,journal"

# only one organization
node src/backup-all.mjs --port <port> --out "<backup folder>" --org "WorkWonders"
```

Add `--list` to any of those to preview exactly what it would take, without
downloading. Worth doing when the filters are doing real work.

Each project lands in `<backup folder>/<organization>/<project name>/` with its
`instructions.md` and a `knowledge/` folder. Previous backups are moved aside,
never overwritten.

## Step 5: another account?

Many people have projects spread across several Claude accounts: a personal
plan, a company account, and accounts belonging to clients. Ask whether there
are more accounts to back up. If yes, repeat from step 3 with a new name and
the next port.

## Step 6: report

Lead with anything that did not work, then what did:

- projects that were skipped, and why
- non-text attachments that exist but were not downloaded
- how many projects were saved, from how many accounts
- where the files are

If the backup folder is cloud-synced, say that teammates will see it once it
syncs. If it is not, say the files are only on this computer and ask whether to
put them somewhere shared.

## Things to get right

- **Never delete a Claude project.** The tool has no delete command. Do not
  write one.
- **Do not push or clone unless asked.** Backing up is reading. `push.mjs` and
  `clone.mjs` exist, but only run them on a direct request.
- **Empty is a real answer.** A project with no instructions and no files backs
  up as an empty folder. Say so rather than treating it as a failure.
- **Say what was left out.** If a filter skipped anything, list it. A quiet
  omission reads as "everything is backed up" when it is not.
- **These are business files.** Knowledge files often hold client financials.
  Do not paste their contents into chat, and do not upload them anywhere the
  person did not choose.
