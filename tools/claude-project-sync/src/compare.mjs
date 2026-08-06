// Work out what differs between a live project and a folder on disk.
//
// Shared by diff.mjs (which only reports) and push.mjs (which acts on it), so
// the thing that decides what changed and the thing that verifies the change
// can never drift apart.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Duplicate filenames are written to disk as "NAME__dup2". Map them back to the
// name the project actually uses.
const liveNameFor = (onDisk) => onDisk.replace(/__dup\d+$/, '');

export const readLocal = (dir) => {
  const instructionsPath = join(dir, 'instructions.md');
  const kbDir = join(dir, 'knowledge');

  if (!existsSync(instructionsPath) && !existsSync(kbDir)) {
    throw new Error(
      `${dir} does not look like an export (no instructions.md and no knowledge/ folder).`
    );
  }

  const instructions = existsSync(instructionsPath)
    ? readFileSync(instructionsPath, 'utf8')
    : '';

  const docs = [];
  if (existsSync(kbDir)) {
    for (const entry of readdirSync(kbDir).sort()) {
      if (entry.startsWith('.')) continue;
      docs.push({
        file_name: liveNameFor(entry),
        on_disk: entry,
        content: readFileSync(join(kbDir, entry), 'utf8'),
      });
    }
  }

  return { instructions, docs };
};

// live: { instructions, docs: [{uuid, file_name, content}] }
// local: output of readLocal
export const compare = (live, local) => {
  const changes = [];
  const warnings = [];

  if (live.instructions !== local.instructions) {
    changes.push({
      kind: 'instructions',
      liveChars: live.instructions.length,
      localChars: local.instructions.length,
    });
  }

  const byName = new Map();
  for (const d of live.docs) {
    if (!byName.has(d.file_name)) byName.set(d.file_name, []);
    byName.get(d.file_name).push(d);
  }

  for (const [name, copies] of byName) {
    if (copies.length > 1) {
      warnings.push(`Live project has ${copies.length} files named "${name}".`);
    }
  }

  const localNames = new Set(local.docs.map((d) => d.file_name));

  for (const l of local.docs) {
    const copies = byName.get(l.file_name) ?? [];
    if (!copies.length) {
      changes.push({ kind: 'add', file_name: l.file_name, content: l.content });
      continue;
    }
    // With duplicates live, compare against the first and treat the rest as
    // extras to remove, rather than guessing which one is canonical.
    const [first, ...extras] = copies;
    if (first.content !== l.content) {
      changes.push({
        kind: 'update',
        file_name: l.file_name,
        uuid: first.uuid,
        content: l.content,
        liveChars: first.content.length,
        localChars: l.content.length,
      });
    }
    for (const e of extras) {
      changes.push({ kind: 'remove', file_name: e.file_name, uuid: e.uuid, reason: 'duplicate' });
    }
  }

  for (const d of live.docs) {
    if (!localNames.has(d.file_name)) {
      changes.push({
        kind: 'remove',
        file_name: d.file_name,
        uuid: d.uuid,
        reason: 'not on disk',
      });
    }
  }

  return { changes, warnings };
};

export const describe = (changes) => {
  if (!changes.length) return ['live project matches disk'];
  const lines = [];
  for (const c of changes) {
    if (c.kind === 'instructions')
      lines.push(`  CHANGED  instructions            (live ${c.liveChars} chars -> disk ${c.localChars})`);
    else if (c.kind === 'update')
      lines.push(`  CHANGED  ${c.file_name}   (live ${c.liveChars} chars -> disk ${c.localChars})`);
    else if (c.kind === 'add') lines.push(`  ONLY ON DISK  ${c.file_name}   (${c.content.length} chars)`);
    else if (c.kind === 'remove') lines.push(`  ONLY LIVE     ${c.file_name}   (${c.reason})`);
  }
  return lines;
};
