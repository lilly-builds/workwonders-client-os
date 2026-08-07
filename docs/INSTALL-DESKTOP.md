# Setting up the backup tool in Claude Code desktop

For someone who does not use a terminal. Works on Windows and Mac.

You do this once. After that it is one command whenever you want a backup.

---

## 1. Install Claude Code desktop

Download it from [claude.com/download](https://claude.com/download) and sign in
with your existing Claude account. Nothing else to configure.

It is a normal app with a window and a chat box. You will not see a command
line.

---

## 2. Get access to the tool

The tool lives in a private GitHub repository, so you need to be added to it
first. Ask Lilly to add you, using the email you want to use for GitHub.

You will get an invitation email from GitHub. Accept it. If you do not have a
GitHub account, that link will walk you through making one. It is free, and you
will not need to use GitHub for anything else.

---

## 3. Add the tool to Claude Code

In Claude Code desktop:

1. Click the **+** button
2. Choose **Plugins**
3. Choose **Add plugin** (or **Add marketplace**)
4. Paste this address:

   ```
   https://github.com/lilly-builds/workwonders-client-os
   ```

5. Pick **WorkWonders Client OS** from the list and install it
6. **Quit Claude Code and open it again.** This one matters. A newly installed
   plugin does not become available until you restart, so without this the
   command in step 4 will look like it does not exist.

If it says it cannot find the repository, that almost always means step 2 is
incomplete: either the invitation was not accepted, or Claude Code is signed
into a different GitHub account than the one that was invited.

If `/backup-claude-projects` is not recognised after installing, you almost
certainly skipped the restart. Quit the app fully and reopen it.

---

## 4. Use it

Type this in the chat box:

```
/backup-claude-projects
```

Claude takes it from there. It will:

- ask where to save the backups, suggesting a Google Drive folder so the team
  can see them
- set itself up, and install anything missing (it will ask first)
- open a separate Chrome window for you to sign into Claude
- show you the projects in that account and ask which ones to back up
- ask whether there are other Claude accounts to do as well
- tell you what it saved and what it could not

**The only things you do:** answer a couple of questions, sign into Claude in
the window it opens, and say which projects to include.

## Putting files back into Claude

The other command goes the other way:

```
/update-claude-project
```

Point it at a folder of project files and it will either update a project that
already exists, or create a new one from it. Use it to apply a change, to undo
one by restoring an older backup, or to copy a project into another Claude
account.

It always shows you exactly what will change and waits for you to agree,
before anything happens. It calls out any file that would be removed, since
that is the change people regret. Afterwards it reads the project back to check
it really did what it said.

It cannot delete a project.

---

## Things worth knowing

**The Chrome window it opens is not your normal Chrome.** It is a separate one
with its own login, kept apart from your everyday browsing. Signing into Claude
there does not affect your usual browser, and it lets several Claude accounts
each stay signed in.

Leave that window open while it works. You can watch it. Do not close it
mid-backup.

**Do it once per Claude account.** If your projects are spread across a personal
plan and client accounts, Claude will walk you through them one at a time. Each
account gets its own Chrome window and its own sign-in.

**It only reads.** It cannot delete a project or change one. Backing up is
copying, and the copies go on your computer.

**If something goes wrong**, say what happened in the chat. Claude wrote the
error and can explain it. You do not need to decode anything yourself.

---

## Updating it later

In Claude Code: **+ → Plugins**, find WorkWonders Client OS, and update it.
Your saved settings and existing backups are not affected.
