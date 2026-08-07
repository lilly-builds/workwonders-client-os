---
name: update-claude-project
description: Put files back into Claude. Takes a folder of project files (instructions and knowledge files) and either updates an existing Claude project or creates a new one from it. Use when someone says "update the project in Claude", "push these changes to Claude", "upload this to Claude", "restore a project", "put this back", "roll back a project", "copy this project to another account", "set up a new client project from this one", or "make a project from these files". Changes only what differs and checks its own work afterwards.
---

# Update a Claude project from files

This writes to a live Claude project. The backup skill only reads; this one
changes things people depend on. Be careful and be explicit.

Two jobs:

- **Update** a project that already exists
- **Create** a new project from a folder, in the same account or a different one

## Talk like a person

Whoever runs this may never have used a terminal. No stack traces, no jargon.
Say what will change before it changes, in plain language.

## Before anything

You need the tool set up and a signed-in browser. This is the same setup the
`backup-claude-projects` skill does, so if that has been run, reuse it: same
tool folder, same Chrome profile, same port.

If not, do those steps first (copy the tool out of `${CLAUDE_PLUGIN_ROOT}`,
`npm install`, launch Chrome, wait for them to sign in). Do not continue until
`node src/list.mjs --port <port>` shows projects.

## Which folder, and where is it going

Ask for the folder of project files. It should contain `instructions.md` and a
`knowledge/` folder. If it does not, say so and stop, rather than pushing an
empty project over a real one.

Then find out which of the two jobs this is:

> "Is this updating a project that already exists in Claude, or creating a new
> one?"

If they are not sure, run `node src/list.mjs --port <port>` and show them what
is there.

## Updating an existing project

**Always show the plan first.** Never skip this, even if they seem in a hurry.

```
node src/push.mjs --port <port> --project <url-or-uuid> --dir "<folder>" --dry-run
```

Translate the plan into plain language before asking:

- "CHANGED" means that file's contents will be replaced
- "ONLY ON DISK" means a new file will be added to the project
- "ONLY LIVE" means **a file will be removed from the project**

Call out removals specifically and by name. Removals are the ones people regret,
and they happen when a folder is out of date rather than because anyone asked.
If anything is being removed, ask directly whether that is intended.

If they confirm, run it for real by dropping `--dry-run`. Answer the tool's
confirmation prompt only after they have said yes to you.

The tool changes only the files that differ, then reads the project back and
compares. Report whichever it says:

- `PUSH VERIFIED` means the live project now matches the folder
- `PUSH INCOMPLETE` means it does not. Say exactly which files, and do not
  describe the update as done.

## Creating a new project

```
node src/clone.mjs --port <port> --dir "<folder>" --name "<project name>" --org "<organization>" --dry-run
```

Ask for the name they want. If the account can see more than one organization,
ask which one, and do not guess: creating a client's project in the wrong place
is quiet and annoying to undo.

Drop `--dry-run` once they confirm. It creates the project, fills it, reads it
back, and prints the URL. Give them the URL.

If it reports `CLONE INCOMPLETE`, the project was still created and left in
place. Say so and give the URL, so a half-filled project is never a mystery.

## Copying between accounts

To move a project from one Claude account to another:

1. Back up from the first account (the `backup-claude-projects` skill)
2. Sign into the second account in its own Chrome window, on its own port
3. Create it there from that folder, with `clone.mjs` and the second port

Each account keeps its own window and its own port, so nothing gets crossed.

## Rolling back

If a change made a project worse, and there is an older backup folder (they are
kept alongside, named `(previous ...)`), push that folder back. That is the
undo. Show the plan first, same as any other update.

## Things to get right

- **Never delete a Claude project.** The tool has no command for it. Do not
  write one, and do not do it through the browser either.
- **Show the plan and wait for a real answer.** Not "shall I proceed?" as a
  formality. Name what changes, especially anything being removed.
- **A push that fails verification is not done.** Report the mismatch plainly.
  Never round "PUSH INCOMPLETE" up to success.
- **Do not push a folder you have not looked at.** Check it has
  `instructions.md` and a non-empty `knowledge/` first.
- **These are business files.** Do not paste their contents into chat.
