import { createHash } from 'node:crypto';

const clean = (value) => String(value ?? '').trim();
const fingerprint = (value) => createHash('sha256').update(String(value ?? '')).digest('hex');
const lineCount = (value) => String(value ?? '').split(/\r?\n/).length;

export const stagingTitle = (liveTitle) => `STAGING — ${clean(liveTitle)}`;
export const stagingRoutingLine = (skillTitle) => `Use the account skill titled "${clean(skillTitle)}" for this STAGING project. Do not use the production skill.`;

export const createProjectManifest = (project, { ignore_instructions_appendix = null } = {}) => {
  if (!clean(project?.id) || !clean(project?.name)) throw new Error('A project manifest needs an exact project ID and name.');
  const files = (project.files ?? []).map((file) => ({ name: clean(file.name), fingerprint: fingerprint(file.content), line_count: lineCount(file.content), source: clean(file.source) || null })).sort((a, b) => a.name.localeCompare(b.name));
  if (files.some((file) => !file.name)) throw new Error('Every project file needs a name.');
  if (new Set(files.map((file) => file.name)).size !== files.length) throw new Error('A project manifest cannot contain duplicate file names.');
  const instructions = String(project.instructions ?? '');
  const normalizedInstructions = ignore_instructions_appendix && instructions.endsWith(ignore_instructions_appendix)
    ? instructions.slice(0, -ignore_instructions_appendix.length).trimEnd()
    : instructions;
  return { project_id: project.id, project_name: project.name, instructions_fingerprint: fingerprint(normalizedInstructions), instructions_line_count: lineCount(normalizedInstructions), files };
};

export const compareProjectManifests = (baseline, candidate) => {
  const before = new Map(baseline.files.map((file) => [file.name, file]));
  const after = new Map(candidate.files.map((file) => [file.name, file]));
  const added = candidate.files.filter((file) => !before.has(file.name)).map((file) => file.name);
  const removed = baseline.files.filter((file) => !after.has(file.name)).map((file) => file.name);
  const changed = baseline.files.filter((file) => after.has(file.name) && after.get(file.name).fingerprint !== file.fingerprint).map((file) => ({ name: file.name, before_fingerprint: file.fingerprint, after_fingerprint: after.get(file.name).fingerprint, before_line_count: file.line_count, after_line_count: after.get(file.name).line_count }));
  const source_changed = baseline.files.filter((file) => after.has(file.name) && after.get(file.name).source !== file.source).map((file) => file.name);
  const instructions_changed = baseline.instructions_fingerprint !== candidate.instructions_fingerprint;
  return { matches: !added.length && !removed.length && !changed.length && !source_changed.length && !instructions_changed, added, removed, changed, source_changed, instructions_changed, instruction_comparison: { before_fingerprint: baseline.instructions_fingerprint, after_fingerprint: candidate.instructions_fingerprint, before_line_count: baseline.instructions_line_count, after_line_count: candidate.instructions_line_count } };
};

export const checkStagingRouting = ({ live_title, candidate, staging_skill_title }) => {
  const expected_title = stagingTitle(live_title);
  const routing_line = stagingRoutingLine(staging_skill_title);
  const exact_title = candidate?.name === expected_title;
  const explicit_routing = String(candidate?.instructions ?? '').includes(routing_line);
  return {
    status: exact_title && explicit_routing ? 'passed' : 'blocked',
    expected_title,
    routing_line,
    exact_title,
    explicit_routing,
    plain_summary: exact_title && explicit_routing ? 'The staging copy has the exact title and names only the staging skill.' : 'The staging copy is not safely isolated yet.',
  };
};
