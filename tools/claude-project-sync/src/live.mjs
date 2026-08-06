// Fetch a project's current state, and find which organization it lives in.
// Read-only. Used by export, diff and push so they all see the same thing.

import { api } from './session.mjs';

export const uuidOf = (s) => {
  const m = String(s).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!m) throw new Error(`Could not find a project id in: ${s}`);
  return m[0];
};

// A login can belong to several organizations. Find the one that actually
// holds this project instead of assuming the first one does.
export const resolveProject = async (page, projectUuid) => {
  const orgs = await api(page, '/api/organizations');
  if (orgs.status !== 200 || !Array.isArray(orgs.json)) {
    throw new Error(`Could not list organizations (status ${orgs.status}).`);
  }
  for (const org of orgs.json) {
    const r = await api(page, `/api/organizations/${org.uuid}/projects/${projectUuid}`);
    if (r.status === 200 && r.json?.uuid) {
      return { org, detail: r.json, base: `/api/organizations/${org.uuid}/projects/${projectUuid}` };
    }
  }
  throw new Error(
    `Project ${projectUuid} is not visible to this login.\n` +
      `Organizations available: ${orgs.json.map((o) => o.name).join(', ') || '(none)'}\n` +
      `If it belongs to someone else it has to be shared with this account first.`
  );
};

export const fetchLive = async (page, base) => {
  const detailRes = await api(page, base);
  if (detailRes.status !== 200) throw new Error(`Could not read project (status ${detailRes.status}).`);
  const docsRes = await api(page, `${base}/docs`);
  if (docsRes.status !== 200 || !Array.isArray(docsRes.json)) {
    throw new Error(`Could not read knowledge files (status ${docsRes.status}).`);
  }
  return {
    detail: detailRes.json,
    instructions: detailRes.json.prompt_template ?? '',
    docs: docsRes.json.map((d) => ({
      uuid: d.uuid,
      file_name: d.file_name,
      content: d.content ?? '',
    })),
  };
};
