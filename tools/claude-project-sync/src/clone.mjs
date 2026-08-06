// CLONE: create a new Claude project from a folder on disk.
//
//   node src/clone.mjs --port 9223 --dir exports/<name> --name "New project"
//   ... --org "WorkWonders"   pick which organization to create it in
//   ... --dry-run             show what would happen and stop
//   ... --yes                 skip the confirmation prompt
//
// Creates an empty project, fills it with the instructions and knowledge files
// from the folder, then reads the whole thing back and compares. It reports
// success only when the new project actually matches the folder.
//
// It never touches an existing project. If creation succeeds but filling it
// fails, it says so and leaves the half-filled project in place with its URL,
// so nothing is silently abandoned.

import { createInterface } from 'readline/promises';
import { connect, goto, api, parseArgs } from './session.mjs';
import { fetchLive } from './live.mjs';
import { readLocal, compare, describe } from './compare.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const dir = args.dir ?? args._[0];
const name = args.name;

if (!dir || !name) {
  console.error(
    'Usage: node src/clone.mjs --port 9223 --dir <folder> --name "New project" [--org "Org name"]'
  );
  process.exit(2);
}

const { browser, page, close } = await connect(port);

try {
  await goto(page, 'https://claude.ai/projects', 4000);

  const local = readLocal(dir);

  const orgsRes = await api(page, '/api/organizations');
  const orgs = orgsRes.json ?? [];
  if (!orgs.length) throw new Error('This login has no organizations.');

  let org;
  if (args.org) {
    org = orgs.find((o) => o.name.toLowerCase().includes(String(args.org).toLowerCase()));
    if (!org) {
      throw new Error(
        `No organization matching "${args.org}". Available: ${orgs.map((o) => o.name).join(', ')}`
      );
    }
  } else if (orgs.length === 1) {
    org = orgs[0];
  } else {
    // Creating in the wrong organization is the kind of mistake that is quiet
    // and annoying, so make the choice explicit rather than picking one.
    throw new Error(
      `This login can see several organizations. Say which one with --org:\n` +
        orgs.map((o) => `  --org "${o.name}"`).join('\n')
    );
  }

  console.log(`from disk:   ${dir}`);
  console.log(`create in:   ${org.name}`);
  console.log(`named:       ${name}`);
  console.log(
    `contents:    instructions (${local.instructions.length} chars) + ${local.docs.length} knowledge file(s)\n`
  );

  if (args['dry-run']) {
    console.log('--dry-run: nothing was created.');
    process.exit(0);
  }

  if (!args.yes) {
    if (!process.stdin.isTTY) {
      console.error('Refusing to create a project unattended without --yes.');
      process.exit(1);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question('Create this project? [y/N] ')).trim();
    rl.close();
    if (!/^y(es)?$/i.test(answer)) {
      console.log('Cancelled. Nothing was created.');
      process.exit(0);
    }
  }

  const created = await api(page, `/api/organizations/${org.uuid}/projects`, {
    method: 'POST',
    body: {
      name,
      description: args.description ?? '',
      is_private: args.public ? false : true,
    },
  });
  if (created.status < 200 || created.status >= 300 || !created.json?.uuid) {
    throw new Error(`Could not create the project (status ${created.status}).`);
  }

  const projectUuid = created.json.uuid;
  const base = `/api/organizations/${org.uuid}/projects/${projectUuid}`;
  const url = `https://claude.ai/project/${projectUuid}`;
  console.log(`created:     ${url}\n`);

  const failed = [];

  if (local.instructions) {
    const r = await api(page, base, {
      method: 'PUT',
      body: { prompt_template: local.instructions },
    });
    if (r.status < 200 || r.status >= 300) failed.push(`instructions (status ${r.status})`);
    else console.log(`  instructions   ${local.instructions.length} chars`);
  }

  for (const d of local.docs) {
    const r = await api(page, `${base}/docs`, {
      method: 'POST',
      body: { file_name: d.file_name, content: d.content },
    });
    if (r.status < 200 || r.status >= 300) failed.push(`${d.file_name} (status ${r.status})`);
    else console.log(`  ${d.file_name}   ${d.content.length} chars`);
  }

  // Read the new project back and compare it to the folder. Anything less is
  // trusting the write calls that just ran.
  const after = await fetchLive(page, base);
  const recheck = compare(after, local);

  if (failed.length) {
    console.log('\nFAILED');
    for (const f of failed) console.log('  x ' + f);
  }

  console.log('\nVERIFY (read the new project back)');
  for (const line of describe(recheck.changes)) console.log(line);

  if (recheck.changes.length || failed.length) {
    console.log(`\nCLONE INCOMPLETE — the new project does not match disk.`);
    console.log(`It was left in place so nothing is lost: ${url}`);
    process.exitCode = 1;
  } else {
    console.log(`\nCLONE VERIFIED — new project matches disk.`);
    console.log(url);
  }
} finally {
  await close();
}
