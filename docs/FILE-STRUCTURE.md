# File structure

One layout, used by everyone, on every machine. If two people back up the same
project the folders should be interchangeable.

Read this before changing what any command writes.

---

## A backed-up project

This is the unit everything else is built on. Every command that pulls a
project writes exactly this shape.

```
<project name>/
  instructions.md      the custom instructions, as plain text
  knowledge/           one file per knowledge file, original filename kept
    KB1_Financial_Context.md
    KB2_Methodology.md
  project.json         what the project is
  manifest.json        what was pulled, and anything that wasn't
```

**`instructions.md`** is always written, even when empty. An empty file means
the project genuinely has no custom instructions. A missing file means
something went wrong.

**`knowledge/`** keeps the filename claude.ai uses, so a push puts it back
under the same name. claude.ai allows two files with the same name in one
project; the second is saved as `NAME__dup2` and the duplicate is recorded in
`manifest.json`. Duplicates are never silently merged.

**`project.json`** is the project's identity: uuid, name, description, which
organization it came from, timestamps.

**`manifest.json`** is the record of the pull: where it came from, when, every
file with its size, attachments that could not be downloaded, and any warnings.
This is what makes a later push safe, because it says what "unchanged" means.

Only `instructions.md` and `knowledge/` are needed to push a folder back up.
The two json files are for humans and for diffing.

---

## A backup of a whole account

`backup-all.mjs` groups by organization, because one login often sees several
and project names repeat between them.

```
<backup folder>/
  summary.json                     what ran, what was taken, what was skipped
  WorkWonders/
    Owner Intelligence/            (the shape above)
    Patriot Projects Advisor/
  Patriot Restoration/
    Owner Intelligence/            same name, different org, no collision
```

A single-project pull with `export.mjs` writes the project folder directly into
the output folder, with no organization level. That is the one deliberate
difference: you asked for one project, you get one folder.

---

## Older copies

Nothing is ever overwritten. An existing folder is renamed before a new one is
written:

```
Owner Intelligence/
Owner Intelligence (previous 2026-08-06 1909)/
```

Dated, sorts sensibly, and reads clearly in Finder. `export.mjs` will ask
whether to keep both, replace, or cancel. Unattended runs always keep both.

---

## Naming

Project and organization names come from claude.ai and can contain anything a
person typed. Before use as a folder name, `/`, `\`, `:` and spaces become `_`
and the result is capped at 180 characters. Filenames inside `knowledge/` get
the same treatment. The real name is always preserved in `project.json` and
`manifest.json`, so nothing is lost to the renaming.

---

## Where these folders live

**Never inside the repo.** Installing this as a plugin copies the whole repo
folder, so anything in it ends up in a plugin cache.

| What | Where | Why |
| --- | --- | --- |
| Backed-up projects | Outside the repo, ideally a synced folder (Drive, Dropbox) | Real client financials; a synced folder also gets them to teammates |
| Browser profiles | `~/.claude-project-sync/profiles/<account>` | Live claude.ai session cookies |
| The code | This repo | The only part that is safe to share |

Both are in `.gitignore` as a second line of defence.

---

## Changing this

If a command needs to write something new, add it here first, then change every
command that writes a project folder. Two commands producing two shapes is how
a diff starts reporting differences that are not real.

## Controlled client updates

`/review-change` is the only approved update entry point. It wraps the
sync tool's transport operations and adds the preview, exact-ID, approval,
candidate, behavior, promotion, and release checks. `/update`
is kept only as a redirect for old callers; it is not a second writer.
