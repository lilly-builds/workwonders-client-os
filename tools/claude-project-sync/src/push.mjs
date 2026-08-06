// PUSH: write a folder on disk into a live Claude project.
//
//   node src/push.mjs --port 9223 --project <url-or-uuid> --dir exports/<name>
//   ... --dry-run     show the plan and stop
//   ... --yes         skip the confirmation prompt
//
// Only changes what actually differs. A file whose contents already match is
// left completely alone, so pushing one fix does not disturb the other files.
//
// Two habits worth knowing about:
//  * Replacing a file creates the new copy BEFORE deleting the old one. If the
//    run dies in between you get a duplicate, which is visible and fixable.
//    Deleting first and dying would lose the file outright.
//  * After writing, it pulls the project back down and re-compares. "Upload
//    returned 201" is not evidence; matching content is.

import { createInterface } from 'readline/promises';
import { connect, goto, api, parseArgs } from './session.mjs';
import { uuidOf, resolveProject, fetchLive } from './live.mjs';
import { readLocal, compare, describe } from './compare.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const target = args.project ?? args._[0];
const dir = args.dir ?? args._[1];

if (!target || !dir) {
  console.error('Usage: node src/push.mjs --port 9223 --project <url-or-uuid> --dir <folder>');
  process.exit(2);
}

const { browser, page, close } = await connect(port);

try {
  await goto(page, 'https://claude.ai/projects', 4000);
  const { org, base } = await resolveProject(page, uuidOf(target));
  const live = await fetchLive(page, base);
  const local = readLocal(dir);

  console.log(`from disk:  ${dir}`);
  console.log(`into live:  ${live.detail.name}  (${org.name})\n`);

  const { changes, warnings } = compare(live, local);
  for (const w of warnings) console.log(`  ! ${w}`);
  if (warnings.length) console.log('');

  if (!changes.length) {
    console.log('Nothing to do. The live project already matches disk.');
    process.exit(0);
  }

  // An empty or wrong folder would otherwise read as "delete everything".
  const removals = changes.filter((c) => c.kind === 'remove').length;
  if (!local.docs.length && live.docs.length) {
    console.error(
      `Refusing to push: the folder has no knowledge files but the project has ${live.docs.length}.\n` +
        `That would empty the project. Check --dir points at a real export.`
    );
    process.exit(1);
  }

  console.log('PLAN');
  for (const line of describe(changes)) console.log(line);
  if (removals) console.log(`\n  ${removals} file(s) would be DELETED from the live project.`);

  if (args['dry-run']) {
    console.log('\n--dry-run: nothing was changed.');
    process.exit(0);
  }

  if (!args.yes) {
    if (!process.stdin.isTTY) {
      console.error('\nRefusing to push unattended without --yes.');
      process.exit(1);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question('\nApply these changes to the live project? [y/N] ')).trim();
    rl.close();
    if (!/^y(es)?$/i.test(answer)) {
      console.log('Cancelled. Nothing was changed.');
      process.exit(0);
    }
  }

  console.log('');
  const applied = [];
  const failed = [];

  const createDoc = async (file_name, content) => {
    const r = await api(page, `${base}/docs`, { method: 'POST', body: { file_name, content } });
    if (r.status < 200 || r.status >= 300) throw new Error(`create failed (status ${r.status})`);
    return r.json?.uuid ?? null;
  };
  const deleteDoc = async (uuid) => {
    const r = await api(page, `${base}/docs/${uuid}`, { method: 'DELETE' });
    if (r.status < 200 || r.status >= 300) throw new Error(`delete failed (status ${r.status})`);
  };

  for (const c of changes) {
    try {
      if (c.kind === 'instructions') {
        const r = await api(page, base, {
          method: 'PUT',
          body: { prompt_template: local.instructions },
        });
        if (r.status < 200 || r.status >= 300) throw new Error(`status ${r.status}`);
        applied.push('instructions updated');
      } else if (c.kind === 'add') {
        await createDoc(c.file_name, c.content);
        applied.push(`added ${c.file_name}`);
      } else if (c.kind === 'update') {
        // New copy first, old copy second. See the note at the top.
        await createDoc(c.file_name, c.content);
        await deleteDoc(c.uuid);
        applied.push(`replaced ${c.file_name}`);
      } else if (c.kind === 'remove') {
        await deleteDoc(c.uuid);
        applied.push(`removed ${c.file_name} (${c.reason})`);
      }
    } catch (e) {
      failed.push(`${c.kind} ${c.file_name ?? ''}: ${e.message}`);
    }
  }

  // Verify by reading the project back, not by trusting the responses above.
  const after = await fetchLive(page, base);
  const recheck = compare(after, local);

  if (failed.length) {
    console.log('FAILED');
    for (const f of failed) console.log('  x ' + f);
    console.log('');
  }

  console.log('APPLIED');
  for (const a of applied) console.log('  - ' + a);

  console.log('\nVERIFY (pulled the project back down)');
  for (const line of describe(recheck.changes)) console.log(line);

  if (recheck.changes.length || failed.length) {
    console.log('\nPUSH INCOMPLETE — live project does not match disk.');
    process.exitCode = 1;
  } else {
    console.log('\nPUSH VERIFIED — live project matches disk.');
  }
} finally {
  await close();
}
