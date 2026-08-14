---
name: update-claude-project
description: Backwards-compatible name for the controlled Client OS update front door.
---

# Backwards-compatible redirect-only entry

Use `/update-client-project`. It is the only approved update entry point.

This old name does not contain a second update workflow. The existing sync
tool is an internal transport primitive used by the new front door. Do not run
its push or clone scripts directly for a client project: the controlled flow
must provide the exact target ID, preview, Lilly approval, candidate checks,
approved-file promotion, fresh comparison, behavior proof, and Release Record.
