# Local Control Center adapter

Phase 2 adds a local-only setup command for an explicit folder that may later
be inside a Google Drive desktop-synced location. It does not connect to
Google Drive, create a cloud folder, inspect permissions, or read client data.

## Setup interface

```text
npm run setup --prefix tools/troubleshooting-folder -- \
  --out /absolute/path/to/Client\ Project\ Control\ Center \
  --client "Fictional Harbor Co" \
  --project-id PROJECT-FAKE-001 \
  --project-name "Fictional Margin Helper"
```

The path must be absolute, must not be a repository path, and must not be a
filesystem root or a file. The adapter writes only to that path.

## Validated folder contract

```text
Client Project Control Center/
  00 Start Here.md
  01 Project Register.md
  02 Issue and Fix Log.md
  03 Trusted Sources.md
  04 Test Library.md
  reports/
  issues/
  releases/
  project-backups/
```

Optional issue, report, and release records are written into their matching
folders. Issue records include links to their project record, reports, and
saved-copy folder. Repeat setup reuses the same named records and does not
make extra editable copies.

## Fake smoke output

Using the fake names above creates the layout shown above, plus a fictional
project register. No real client name, client record, or Drive folder belongs
in tests or this repository.

## Verification

```text
npm test --prefix tools/troubleshooting-foundation
node --test tests/troubleshooting-folder.test.mjs
npm run validate --prefix tools/troubleshooting-folder -- /absolute/path/to/Client\ Project\ Control\ Center
```

The tests cover first setup, repeat setup, missing core files, unknown project
references, duplicate issue IDs, unsafe paths, and no-duplicate behavior.

## Handoff decisions still needed

Lilly and Jim still need to choose the approved shared Drive-synced location,
confirm that Drive desktop sync is available, and verify real sharing and write
permissions. Those real-permission steps are intentionally unverified here.

Prompt 3 can use this folder contract and the saved-copy folder for guided
investigation against fake saved-copy fixtures. This phase does not implement
Basecamp, a live Claude pull, or cloud scheduling.
