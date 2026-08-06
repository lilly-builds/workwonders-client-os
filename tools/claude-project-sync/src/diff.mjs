// Is the live project running what we think it is?
//
// Compares a live Claude project against a folder on disk. Read-only: it
// changes nothing, on either side.
//
//   node src/diff.mjs --port 9223 --project <url-or-uuid> --dir exports/<name>
//
// Exit code is 0 when they match and 1 when they differ, so it can gate a
// later step rather than just printing.

import { connect, goto, parseArgs } from './session.mjs';
import { uuidOf, resolveProject, fetchLive } from './live.mjs';
import { readLocal, compare, describe } from './compare.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const target = args.project ?? args._[0];
const dir = args.dir ?? args._[1];

if (!target || !dir) {
  console.error('Usage: node src/diff.mjs --port 9223 --project <url-or-uuid> --dir <folder>');
  process.exit(2);
}

const { browser, page, close } = await connect(port);

try {
  await goto(page, 'https://claude.ai/projects', 4000);
  const { org, base } = await resolveProject(page, uuidOf(target));
  const live = await fetchLive(page, base);
  const local = readLocal(dir);

  console.log(`live:  ${live.detail.name}  (${org.name})`);
  console.log(`disk:  ${dir}`);
  console.log(
    `       ${live.docs.length} live knowledge file(s) vs ${local.docs.length} on disk\n`
  );

  const { changes, warnings } = compare(live, local);

  for (const w of warnings) console.log(`  ! ${w}`);
  if (warnings.length) console.log('');

  for (const line of describe(changes)) console.log(line);

  if (changes.length) {
    console.log(`\n${changes.length} difference(s). The live project has drifted from disk.`);
    process.exitCode = 1;
  } else {
    console.log('\nIN SYNC');
  }
} finally {
  await close();
}
