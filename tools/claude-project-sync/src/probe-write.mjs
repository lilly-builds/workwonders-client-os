// One-time experiment: find out whether the write side of the project API works
// the way the read side implies. Run this against a THROWAWAY project only.
//
//   node src/probe-write.mjs --port 9223 --project <uuid>
//
// It creates one knowledge file named __probe_delete_me.md, reads it back,
// deletes it, and confirms it is gone. It also reads the current instructions,
// writes them back unchanged, and re-reads to confirm nothing was lost.
//
// Everything it creates, it removes. It never touches a file it did not make.

import { connect, goto, api, parseArgs } from './session.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const projectUuid = String(args.project ?? args._[0] ?? '').match(
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
)?.[0];

if (!projectUuid) {
  console.error('Need --project <uuid-or-url> (use a throwaway project).');
  process.exit(1);
}

const PROBE_NAME = '__probe_delete_me.md';
const PROBE_BODY = 'temporary file written by probe-write.mjs; safe to delete\n';

const { browser, page, close } = await connect(port);
const results = [];
const note = (step, ok, detail) => {
  results.push({ step, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}${detail ? `  ${detail}` : ''}`);
};

let createdUuid = null;
let org = null;

try {
  await goto(page, 'https://claude.ai/projects', 4000);

  const orgs = await api(page, '/api/organizations');
  for (const o of orgs.json ?? []) {
    const r = await api(page, `/api/organizations/${o.uuid}/projects/${projectUuid}`);
    if (r.status === 200) {
      org = o;
      break;
    }
  }
  if (!org) throw new Error('Project not found in any org for this login.');

  const base = `/api/organizations/${org.uuid}/projects/${projectUuid}`;
  const before = await api(page, `${base}/docs`);
  const beforeCount = (before.json ?? []).length;
  console.log(`project has ${beforeCount} knowledge file(s) before the probe\n`);

  // --- create ---
  const created = await api(page, `${base}/docs`, {
    method: 'POST',
    body: { file_name: PROBE_NAME, content: PROBE_BODY },
  });
  const okcreate = created.status >= 200 && created.status < 300;
  note('POST /docs (create)', okcreate, `status ${created.status}`);
  if (okcreate) createdUuid = created.json?.uuid ?? null;

  // --- read back ---
  if (createdUuid) {
    const after = await api(page, `${base}/docs`);
    const found = (after.json ?? []).find((d) => d.uuid === createdUuid);
    note(
      'read back the created file',
      Boolean(found) && found.content === PROBE_BODY,
      found ? `content matches: ${found.content === PROBE_BODY}` : 'not found'
    );
  }

  // --- delete ---
  if (createdUuid) {
    const del = await api(page, `${base}/docs/${createdUuid}`, { method: 'DELETE' });
    const okdel = del.status >= 200 && del.status < 300;
    note('DELETE /docs/{uuid}', okdel, `status ${del.status}`);
    if (okdel) {
      const after = await api(page, `${base}/docs`);
      const stillThere = (after.json ?? []).some((d) => d.uuid === createdUuid);
      note('probe file actually gone', !stillThere, `count now ${(after.json ?? []).length}`);
      if (!stillThere) createdUuid = null;
    }
  }

  // --- instructions: write back the SAME text, so a failure changes nothing ---
  const detail = await api(page, base);
  const original = detail.json?.prompt_template ?? '';
  const put = await api(page, base, {
    method: 'PUT',
    body: { prompt_template: original },
  });
  const okput = put.status >= 200 && put.status < 300;
  note('PUT instructions (unchanged text)', okput, `status ${put.status}`);

  const recheck = await api(page, base);
  note(
    'instructions still intact',
    (recheck.json?.prompt_template ?? '') === original,
    `${(recheck.json?.prompt_template ?? '').length} chars (was ${original.length})`
  );
} catch (e) {
  console.error('\nprobe error:', e.message);
} finally {
  // Never leave the probe file behind, even if something above threw.
  if (createdUuid && org) {
    const base = `/api/organizations/${org.uuid}/projects/${projectUuid}`;
    const cleanup = await api(page, `${base}/docs/${createdUuid}`, { method: 'DELETE' });
    console.log(`\ncleanup: removed probe file (status ${cleanup.status})`);
  }
  console.log('\n--- summary ---');
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.step}`);
  await close();
}
