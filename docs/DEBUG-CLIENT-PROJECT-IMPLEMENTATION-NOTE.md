# Debug client project — implementation note

- **Command entry point:** `skills/debug-client-project/SKILL.md`, discovered
  as `/debug-client-project` through the plugin's existing `skills/` setting.
- **Blank templates:** `templates/troubleshooting/` contains all ten named
  record shapes.
- **Required fields:** each template declares `required_fields` in its header.
  A `passed` status also needs a check method, evidence reference, checker, and
  check date.
- **Tests:** `npm test --prefix tools/troubleshooting-foundation`; fake dry run:
  `npm run dry-run --prefix tools/troubleshooting-foundation -- --out <empty-local-folder>`.
- **Convention uncertainty:** this plugin has no separate slash-command
  registration file. It relies on normal Claude Code skill discovery from
  `plugin.json`'s `skills: "./skills/"` setting.

Prompt 2 can add a safe local Drive-synced-folder adapter around these reusable
records. Do not create a Drive folder or put client-specific material here.
