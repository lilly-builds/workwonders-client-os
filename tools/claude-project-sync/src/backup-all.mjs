// Back up every project this login can reach, across every organization.
//
//   node src/backup-all.mjs --port 9223 --out "/path/to/backup folder"
//
// Read-only. Each project becomes its own folder under
// <out>/<organization>/<project name>/, and a summary.json records what was
// taken and anything that could not be.
//
// Projects with no instructions and no knowledge files are still recorded, so
// an empty project is visibly empty rather than missing.

import { mkdirSync, writeFileSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import { connect, goto, api, parseArgs, safeFilename } from './session.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const outRoot = args.out ?? join(process.cwd(), 'exports');

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}${p(d.getMinutes())}`;
};

const { browser, page, close } = await connect(port);

const summary = { taken: [], skipped: [], organizations: [], startedAt: new Date().toISOString() };

try {
  await goto(page, 'https://claude.ai/projects', 4000);

  const orgsRes = await api(page, '/api/organizations');
  if (orgsRes.status !== 200 || !Array.isArray(orgsRes.json)) {
    throw new Error(`Could not list organizations (status ${orgsRes.status}).`);
  }
  const orgs = orgsRes.json;
  console.log(`signed-in account can see ${orgs.length} organization(s)\n`);

  for (const org of orgs) {
    summary.organizations.push(org.name);
    console.log(`=== ${org.name} ===`);

    // Page through rather than assuming one request holds everything.
    const rows = [];
    let offset = 0;
    while (true) {
      const r = await api(
        page,
        `/api/organizations/${org.uuid}/projects_v2?limit=50&offset=${offset}&order_by=updated_at&is_archived=false`
      );
      if (r.status !== 200 || !r.json?.data) {
        summary.skipped.push({ org: org.name, reason: `project list failed (status ${r.status})` });
        break;
      }
      rows.push(...r.json.data);
      if (!r.json.pagination?.has_more) break;
      offset += 50;
    }

    if (!rows.length) {
      console.log('  (no projects)\n');
      continue;
    }

    const orgDir = join(outRoot, safeFilename(org.name));

    for (const p of rows) {
      const base = `/api/organizations/${org.uuid}/projects/${p.uuid}`;
      try {
        const detailRes = await api(page, base);
        if (detailRes.status !== 200) throw new Error(`detail status ${detailRes.status}`);
        const detail = detailRes.json;

        const docsRes = await api(page, `${base}/docs`);
        if (docsRes.status !== 200 || !Array.isArray(docsRes.json)) {
          throw new Error(`docs status ${docsRes.status}`);
        }
        const docs = docsRes.json;

        const filesRes = await api(page, `${base}/files`);
        const files = Array.isArray(filesRes.json) ? filesRes.json : [];

        const dir = join(orgDir, safeFilename(detail.name));
        // Never overwrite a previous backup: move it aside first.
        if (existsSync(dir)) renameSync(dir, `${dir} (previous ${stamp()})`);
        mkdirSync(join(dir, 'knowledge'), { recursive: true });

        writeFileSync(join(dir, 'instructions.md'), detail.prompt_template ?? '');

        const seen = new Map();
        const written = [];
        for (const d of docs) {
          const n = (seen.get(d.file_name) ?? 0) + 1;
          seen.set(d.file_name, n);
          const base2 = safeFilename(d.file_name);
          const onDisk = n === 1 ? base2 : `${base2}__dup${n}`;
          writeFileSync(join(dir, 'knowledge', onDisk), d.content ?? '');
          written.push({ file_name: d.file_name, on_disk: onDisk, chars: (d.content ?? '').length });
        }

        // Same two files every command writes, so a folder from here is
        // interchangeable with one from export.mjs. See docs/FILE-STRUCTURE.md.
        writeFileSync(
          join(dir, 'project.json'),
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
          join(dir, 'manifest.json'),
          JSON.stringify(
            {
              pulled_from: { org: org.name, org_uuid: org.uuid, project_uuid: detail.uuid },
              source_url: `https://claude.ai/project/${detail.uuid}`,
              pulled_at: new Date().toISOString(),
              instructions_chars: (detail.prompt_template ?? '').length,
              knowledge_files: written.length,
              docs: written,
              unpulled_attachments: files.map((f) => f.file_name ?? f.uuid),
              warnings: [],
            },
            null,
            2
          )
        );

        const bits = [];
        if (detail.prompt_template) bits.push(`instructions ${detail.prompt_template.length} chars`);
        bits.push(`${written.length} file(s)`);
        if (files.length) bits.push(`${files.length} attachment(s) NOT downloaded`);
        console.log(`  ok  ${detail.name}  (${bits.join(', ')})`);

        summary.taken.push({
          org: org.name,
          project: detail.name,
          uuid: detail.uuid,
          instructions_chars: (detail.prompt_template ?? '').length,
          knowledge_files: written.length,
          attachments_not_downloaded: files.length,
        });
      } catch (e) {
        console.log(`  SKIPPED  ${p.name}  (${e.message})`);
        summary.skipped.push({ org: org.name, project: p.name, reason: e.message });
      }
    }
    console.log('');
  }

  summary.finishedAt = new Date().toISOString();
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, 'summary.json'), JSON.stringify(summary, null, 2));

  // Problems before successes.
  if (summary.skipped.length) {
    console.log('COULD NOT BACK UP');
    for (const s of summary.skipped)
      console.log(`  x ${s.org}${s.project ? ' / ' + s.project : ''}: ${s.reason}`);
    console.log('');
  }

  const attach = summary.taken.reduce((n, t) => n + t.attachments_not_downloaded, 0);
  if (attach) console.log(`Note: ${attach} non-text attachment(s) exist but were not downloaded.\n`);

  console.log(`BACKED UP ${summary.taken.length} project(s) from ${orgs.length} account area(s)`);
  console.log(`into: ${outRoot}`);
} finally {
  await close();
}
