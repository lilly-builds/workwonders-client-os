import { access, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const CORE_FILES = [
  '00 Start Here.md',
  '01 Project Register.md',
  '02 Issue and Fix Log.md',
  '03 Trusted Sources.md',
  '04 Test Library.md',
];
export const CORE_DIRECTORIES = ['reports', 'issues', 'releases', 'project-backups'];

const safePart = (value, label) => {
  if (typeof value !== 'string' || !value.trim() || value.includes('/') || value.includes('\\') || value === '.' || value === '..' || /[\0\r\n]/.test(value)) {
    throw new Error(`${label} contains an unsafe name.`);
  }
  return value.trim();
};

async function existingRealPath(target) {
  let candidate = target;
  while (true) {
    try { return await realpath(candidate); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(candidate);
      if (parent === candidate) throw error;
      candidate = parent;
    }
  }
}

export async function assertSafeOutputPath(outputDir, { repoRoot } = {}) {
  if (!path.isAbsolute(outputDir)) throw new Error('Output path must be an absolute path.');
  const resolved = path.resolve(outputDir);
  if (resolved === path.parse(resolved).root) throw new Error('Output path cannot be a filesystem root.');
  if (repoRoot) {
    const actualOutput = await existingRealPath(resolved);
    const actualRepo = await realpath(path.resolve(repoRoot));
    if (actualOutput === actualRepo || actualOutput.startsWith(`${actualRepo}${path.sep}`)) {
      throw new Error('Output path must be outside the repository.');
    }
  }
  try {
    const info = await lstat(resolved);
    if (!info.isDirectory()) throw new Error('Output path must be a folder, not a file.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const frontMatter = (fields) => `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n`;

function coreContent(file, clientName, project) {
  const label = 'FICTIONAL LOCAL TEST DATA — replace with approved client material only when using a real Drive-synced folder.';
  const base = `# ${file.replace(/\.md$/, '')}\n\n> ${label}\n\nClient: ${clientName}\nProject: ${project.name} (${project.id})\n`;
  if (file === '00 Start Here.md') return `${base}\nThis folder is the single shared home for this client project. The repository holds reusable rules and blank templates; this folder holds client-specific records.\n\n- Project record: [01 Project Register.md](./01%20Project%20Register.md)\n- Issue and fix log: [02 Issue and Fix Log.md](./02%20Issue%20and%20Fix%20Log.md)\n- Reports: [reports](./reports/)\n- Saved project copies: [project-backups](./project-backups/)\n\nDrive assumption: this is an explicit local path that may later be inside a Drive-synced folder. Sync and sharing permissions are not checked by this local adapter.\n`;
  if (file === '01 Project Register.md') return `${frontMatter({ record_type: 'Project Register', project_id: project.id })}${base}\n## Project\n\n- Project ID: ${project.id}\n- Project name: ${project.name}\n- Saved-copy location: ${project.savedCopyLocation || 'Not supplied'}\n- Project backups folder: [project-backups](./project-backups/)\n- Status: active\n`;
  if (file === '02 Issue and Fix Log.md') return `${base}\nEach issue file must name its project ID, report links, and saved-copy location.\n\n## Issues\n\nNo issues recorded yet.\n`;
  if (file === '03 Trusted Sources.md') return `${base}\nNo trusted sources recorded yet.\n`;
  return `${base}\nNo test records recorded yet.\n`;
}

async function writeOnce(file, content) {
  try { await access(file); return { file, created: false }; }
  catch (error) { if (error.code !== 'ENOENT') throw error; await writeFile(file, content, 'utf8'); return { file, created: true }; }
}

function datedName(date, title, suffix) {
  const day = date instanceof Date ? date.toISOString().slice(0, 10) : date;
  return `${day} ${safePart(title, 'Record title')}${suffix}.md`;
}

export async function setupControlCenter({ outputDir, clientName, project, issues = [], reports = [], releases = [], repoRoot }) {
  safePart(clientName, 'Client name');
  if (!project?.id || !project?.name) throw new Error('A project ID and project name are required.');
  safePart(project.id, 'Project ID'); safePart(project.name, 'Project name');
  await assertSafeOutputPath(outputDir, { repoRoot });
  const root = path.resolve(outputDir);
  await mkdir(root, { recursive: true });
  for (const directory of CORE_DIRECTORIES) await mkdir(path.join(root, directory), { recursive: true });
  const results = [];
  for (const file of CORE_FILES) results.push(await writeOnce(path.join(root, file), coreContent(file, clientName, project)));

  for (const issue of issues) {
    safePart(issue.issueId, 'Issue ID'); safePart(issue.title, 'Issue title');
    if (issue.projectId !== project.id) throw new Error(`Issue ${issue.issueId} references unknown project ${issue.projectId}.`);
    const file = datedName(issue.date || new Date(), `${issue.issueId} ${issue.title}`, '');
    const target = path.join(root, 'issues', file);
    const content = `${frontMatter({ record_type: 'Issue', issue_id: issue.issueId, project_id: issue.projectId })}# ${issue.issueId}: ${issue.title}\n\n> FICTIONAL LOCAL TEST DATA — not client material.\n\nProject: [${project.name}](../01%20Project%20Register.md)\nReports: ${(issue.reportFiles || []).map((name) => `[${name}](../reports/${encodeURIComponent(name)})`).join(', ') || 'None yet'}\nSaved copy: [${issue.savedCopyLocation || project.savedCopyLocation || 'Not supplied'}](../project-backups/)\nStatus: ${issue.status || 'not_checked'}\n`;
    results.push(await writeOnce(target, content));
  }
  for (const report of reports) {
    safePart(report.title, 'Report title');
    const target = path.join(root, 'reports', datedName(report.date || new Date(), report.title, ' Health Report'));
    const content = `${frontMatter({ record_type: 'Health Report', report_id: report.reportId || 'REPORT-FAKE', project_id: project.id })}# ${report.title}\n\n> FICTIONAL LOCAL TEST DATA — not client material.\n\nProject: [${project.name}](../01%20Project%20Register.md)\nSaved copy: [${report.savedCopyLocation || project.savedCopyLocation || 'Not supplied'}](../project-backups/)\n`;
    results.push(await writeOnce(target, content));
  }
  for (const release of releases) {
    safePart(release.title, 'Release title');
    const target = path.join(root, 'releases', datedName(release.date || new Date(), release.title, ' Release Record'));
    const content = `${frontMatter({ record_type: 'Release Record', release_id: release.releaseId || 'RELEASE-FAKE', target_project_id: project.id })}# ${release.title}\n\n> FICTIONAL LOCAL TEST DATA — not client material.\n\nProject: [${project.name}](../01%20Project%20Register.md)\nSaved copy: [${release.savedCopyLocation || project.savedCopyLocation || 'Not supplied'}](../project-backups/)\n`;
    results.push(await writeOnce(target, content));
  }
  return { root, results, created: results.filter((item) => item.created).map((item) => item.file), reused: results.filter((item) => !item.created).map((item) => item.file) };
}

async function filesUnder(directory) {
  try { return (await readdir(directory, { withFileTypes: true })).flatMap((entry) => entry.isDirectory() ? [] : [path.join(directory, entry.name)]); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

export async function validateControlCenter(outputDir, { projectIds = [], repoRoot } = {}) {
  await assertSafeOutputPath(outputDir, { repoRoot });
  const errors = [];
  for (const file of CORE_FILES) { try { await access(path.join(outputDir, file)); } catch { errors.push(`Missing core file: ${file}`); } }
  for (const directory of CORE_DIRECTORIES) { try { if (!(await lstat(path.join(outputDir, directory))).isDirectory()) errors.push(`Core path is not a folder: ${directory}`); } catch { errors.push(`Missing core folder: ${directory}`); } }
  const known = new Set(projectIds);
  try {
    const register = await readFile(path.join(outputDir, '01 Project Register.md'), 'utf8');
    for (const match of register.matchAll(/^project_id: (.+)$/gm)) known.add(match[1].trim());
  } catch {}
  const issueIds = new Set();
  for (const file of await filesUnder(path.join(outputDir, 'issues'))) {
    const text = await readFile(file, 'utf8');
    const issueId = text.match(/^issue_id: (.+)$/m)?.[1]?.trim();
    const projectId = text.match(/^project_id: (.+)$/m)?.[1]?.trim();
    if (!issueId) continue;
    if (issueIds.has(issueId)) errors.push(`Duplicate issue ID: ${issueId}`); else issueIds.add(issueId);
    if (projectId && !known.has(projectId)) errors.push(`Unknown project reference: ${projectId} in ${path.basename(file)}`);
  }
  return errors;
}
