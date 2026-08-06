// List every project this Chrome profile's login can see, across all its
// organizations. Read-only.
//
//   node src/list.mjs --port 9223

import { connect, goto, api, parseArgs } from './session.mjs';

const args = parseArgs();
const port = args.port ?? 9223;

const { browser, page, close } = await connect(port);

try {
  await goto(page, 'https://claude.ai/projects', 4000);

  const orgs = await api(page, '/api/organizations');
  if (orgs.status !== 200 || !Array.isArray(orgs.json)) {
    throw new Error(`Could not list organizations (status ${orgs.status}).`);
  }

  for (const org of orgs.json) {
    console.log(`\n=== ${org.name}  (${org.uuid}) ===`);

    // Page through rather than trusting one request to hold everything.
    let offset = 0;
    let total = null;
    const rows = [];
    while (true) {
      const r = await api(
        page,
        `/api/organizations/${org.uuid}/projects_v2?limit=50&offset=${offset}&order_by=updated_at&is_archived=false`
      );
      if (r.status !== 200 || !r.json?.data) {
        console.log(`  (could not read projects: status ${r.status})`);
        break;
      }
      rows.push(...r.json.data);
      total = r.json.pagination?.total ?? rows.length;
      if (!r.json.pagination?.has_more) break;
      offset += 50;
    }

    if (!rows.length) {
      console.log('  (no projects)');
      continue;
    }

    for (const p of rows) {
      const counts = `${String(p.docs_count ?? 0).padStart(3)} docs`;
      console.log(`  ${counts}  ${p.uuid}  ${p.name}`);
    }
    console.log(`  ${rows.length} shown of ${total} total`);
  }
} finally {
  await close();
}
