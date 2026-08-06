// PULL: copy a Claude project down to a folder on disk.
//
// Read-only against claude.ai. It only ever issues GETs. It cannot change,
// delete, or reorder anything in the project it is reading.
//
//   node src/export.mjs --port 9223 --project <url-or-uuid>
//   node src/export.mjs --port 9223 --project <uuid> --out ./exports/patriot
//
// If the destination already holds an export, you choose what happens to it:
//   --keep replace   overwrite it (the old copy is gone)
//   --keep version   move it to <folder>_v2, _v3 ... and write fresh alongside
//   --keep skip      stop and change nothing
// Leave --keep off and it asks. It never silently destroys a previous pull.
//
// Writes:
//   <out>/project.json      what the project is (name, description, counts)
//   <out>/instructions.md   the custom instructions
//   <out>/knowledge/*       every knowledge file, original filename, full text
//   <out>/manifest.json     filename -> claude uuid, sizes, and any warnings
//
// The manifest is what makes a later push safe: it records exactly what was
// pulled, so a diff can tell you whether the live project still matches disk.

import { mkdirSync, writeFileSync, rmSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline/promises';
import { connect, goto, api, parseArgs, safeFilename } from './session.mjs';

// "<folder> (previous 2026-08-06 1907)" sits next to the current export and
// reads plainly in Finder, so an older pull is obvious rather than cryptic.
const archiveName = (dir) => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}${p(d.getMinutes())}`;
  let candidate = `${dir} (previous ${stamp})`;
  let n = 2;
  while (existsSync(candidate)) candidate = `${dir} (previous ${stamp}-${n++})`;
  return candidate;
};

const KEEP_MODES = ['replace', 'version', 'skip'];

const resolveKeepMode = async (flag, outDir) => {
  if (typeof flag === 'string') {
    const m = flag.toLowerCase();
    if (!KEEP_MODES.includes(m)) {
      throw new Error(`--keep must be one of: ${KEEP_MODES.join(', ')} (got "${flag}")`);
    }
    return m;
  }
  // Unattended runs must not destroy anything they were not told to destroy.
  if (!process.stdin.isTTY) {
    console.log('An export already exists and no --keep was given. Defaulting to "version".');
    return 'version';
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(`\nThere is already an export here:\n  ${outDir}`);
    console.log('  [1] Keep both  - move the old one aside, write a fresh copy  (default)');
    console.log('  [2] Replace it - delete the old one');
    console.log('  [3] Cancel     - change nothing');
    const answer = (await rl.question('Choose 1, 2 or 3: ')).trim();
    return { 1: 'version', 2: 'replace', 3: 'skip', '': 'version' }[answer] ?? 'version';
  } finally {
    rl.close();
  }
};

const args = parseArgs();
const port = args.port ?? 9223;
const target = args.project ?? args._[0];

if (!target) {
  console.error(
    'Which project?\n' +
      '  node src/export.mjs --port 9223 --project <project-url-or-uuid>\n' +
      '  node src/list.mjs   --port 9223          (to see what is available)'
  );
  process.exit(1);
}

// Accept a full claude.ai URL or a bare uuid.
const uuidOf = (s) => {
  const m = String(s).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!m) throw new Error(`Could not find a project id in: ${s}`);
  return m[0];
};
const projectUuid = uuidOf(target);

const { browser, page, close } = await connect(port);

try {
  // Any claude.ai page will do; we just need the app origin so the session
  // cookies apply to our API calls.
  await goto(page, 'https://claude.ai/projects', 4000);

  const orgsRes = await api(page, '/api/organizations');
  if (orgsRes.status !== 200 || !Array.isArray(orgsRes.json)) {
    throw new Error(`Could not list organizations (status ${orgsRes.status}).`);
  }

  // A login can belong to more than one org. Find the one that actually holds
  // this project rather than assuming the first.
  let org = null;
  let detail = null;
  for (const o of orgsRes.json) {
    const r = await api(page, `/api/organizations/${o.uuid}/projects/${projectUuid}`);
    if (r.status === 200 && r.json?.uuid) {
      org = o;
      detail = r.json;
      break;
    }
  }

  if (!detail) {
    throw new Error(
      `Project ${projectUuid} was not found in any organization this login can see.\n` +
        `Organizations available: ${orgsRes.json.map((o) => o.name).join(', ') || '(none)'}\n` +
        `If this project belongs to someone else, it has to be shared with this account first.`
    );
  }

  console.log(`org:      ${org.name}`);
  console.log(`project:  ${detail.name}`);
  console.log(`docs:     ${detail.docs_count}   files: ${detail.files_count}`);

  const docsRes = await api(page, `/api/organizations/${org.uuid}/projects/${projectUuid}/docs`);
  if (docsRes.status !== 200 || !Array.isArray(docsRes.json)) {
    throw new Error(`Could not read knowledge files (status ${docsRes.status}).`);
  }
  const docs = docsRes.json;

  // Non-text attachments live on a different endpoint. We can see that they
  // exist but cannot pull their bytes this way, so say so rather than quietly
  // producing an incomplete export.
  const filesRes = await api(page, `/api/organizations/${org.uuid}/projects/${projectUuid}/files`);
  const files = Array.isArray(filesRes.json) ? filesRes.json : [];

  const warnings = [];

  // claude.ai appends uploads instead of replacing them, so a project really
  // can hold two files with the same name. Never collapse them silently: that
  // was the Set-dedup bug in the earlier scripts.
  const nameCounts = new Map();
  for (const d of docs) nameCounts.set(d.file_name, (nameCounts.get(d.file_name) ?? 0) + 1);
  const duplicated = [...nameCounts].filter(([, n]) => n > 1);
  if (duplicated.length) {
    warnings.push(
      `Project contains duplicate knowledge filenames: ${duplicated
        .map(([n, c]) => `${n} x${c}`)
        .join(', ')}. Each copy was written to disk with a __dupN suffix so nothing is lost.`
    );
  }

  if (detail.docs_count !== docs.length) {
    warnings.push(
      `Project reports docs_count=${detail.docs_count} but the docs endpoint returned ${docs.length}.`
    );
  }

  if (files.length) {
    warnings.push(
      `Project has ${files.length} non-text attachment(s) that this exporter does not pull: ` +
        files.map((f) => f.file_name ?? f.uuid).join(', ')
    );
  }

  const outDir =
    args.out ?? join(new URL('../exports', import.meta.url).pathname, safeFilename(detail.name));

  // A previous export sitting in the destination is somebody's work. Decide
  // what happens to it out loud, never by default.
  //
  // Writing fresh files over an old export without clearing it would leave
  // stale files behind that look like part of this pull, so every path here
  // either empties the folder or moves the whole thing aside.
  if (existsSync(outDir)) {
    const mode = await resolveKeepMode(args.keep, outDir);
    if (mode === 'skip') {
      console.log(`\nLeft the existing export untouched: ${outDir}`);
      console.log('Nothing was pulled.');
      process.exit(0);
    }
    if (mode === 'version') {
      const archived = archiveName(outDir);
      renameSync(outDir, archived);
      console.log(`kept previous export as: ${archived}`);
    } else {
      rmSync(outDir, { recursive: true, force: true });
      console.log('replaced previous export');
    }
  }
  mkdirSync(join(outDir, 'knowledge'), { recursive: true });

  writeFileSync(join(outDir, 'instructions.md'), detail.prompt_template ?? '');

  const seen = new Map();
  const manifestDocs = [];
  for (const d of docs) {
    const n = (seen.get(d.file_name) ?? 0) + 1;
    seen.set(d.file_name, n);
    const base = safeFilename(d.file_name);
    const onDisk = n === 1 ? base : `${base}__dup${n}`;
    writeFileSync(join(outDir, 'knowledge', onDisk), d.content ?? '');
    manifestDocs.push({
      file_name: d.file_name,
      on_disk: `knowledge/${onDisk}`,
      claude_uuid: d.uuid,
      chars: (d.content ?? '').length,
      estimated_token_count: d.estimated_token_count ?? null,
      created_at: d.created_at ?? null,
    });
  }

  writeFileSync(
    join(outDir, 'project.json'),
    JSON.stringify(
      {
        uuid: detail.uuid,
        name: detail.name,
        description: detail.description,
        is_private: detail.is_private,
        docs_count: detail.docs_count,
        files_count: detail.files_count,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
        organization: { uuid: org.uuid, name: org.name },
      },
      null,
      2
    )
  );

  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        pulled_from: { org: org.name, org_uuid: org.uuid, project_uuid: detail.uuid },
        source_url: `https://claude.ai/project/${detail.uuid}`,
        instructions_chars: (detail.prompt_template ?? '').length,
        knowledge_files: manifestDocs.length,
        docs: manifestDocs,
        unpulled_attachments: files.map((f) => f.file_name ?? f.uuid),
        warnings,
      },
      null,
      2
    )
  );

  console.log(`\nwrote -> ${outDir}`);
  console.log(`  instructions.md   ${(detail.prompt_template ?? '').length} chars`);
  console.log(`  knowledge/        ${manifestDocs.length} file(s)`);
  for (const d of manifestDocs) console.log(`    ${d.file_name}  (${d.chars} chars)`);

  // Problems before successes.
  if (warnings.length) {
    console.log('\nWARNINGS');
    for (const w of warnings) console.log('  ! ' + w);
  }

  const empty = manifestDocs.filter((d) => d.chars === 0);
  if (empty.length) console.log(`\n  ! ${empty.length} knowledge file(s) came back empty.`);
  if (!detail.prompt_template) console.log('  ! This project has no custom instructions set.');
} finally {
  await close();
}
