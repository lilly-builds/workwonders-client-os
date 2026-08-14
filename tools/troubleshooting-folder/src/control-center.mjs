import { access, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplateDefinitions, validateRecordCollection } from '../../troubleshooting-foundation/src/records.mjs';

export const CORE_FILES = [
  '00 Start Here.md',
  '01 Project Register.md',
  '02 Issue and Fix Log.md',
  '03 Trusted Sources.md',
  '04 Test Library.md',
];
export const CORE_DIRECTORIES = ['reports', 'issues', 'releases', 'project-backups'];
const ID_FIELDS = { 'Project Register': 'project_id', 'Issue & Fix Log': 'issue_id', 'Health Report': 'report_id', 'Troubleshooting Card': 'card_id', 'Data Integrity Report': 'report_id', 'Developer Ticket': 'ticket_id', 'Release Record': 'release_id' };

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
    if (actualOutput === actualRepo || actualOutput.startsWith(`${actualRepo}${path.sep}`)) throw new Error('Output path must be outside the repository.');
  }
  try {
    const info = await lstat(resolved);
    if (!info.isDirectory()) throw new Error('Output path must be a folder, not a file.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const frontMatter = (fields) => `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n`;

function recordLabel(mode) {
  if (mode === 'fake') return '> FICTIONAL LOCAL TEST DATA — not client material.\n';
  return '> APPROVED CLIENT-FOLDER RECORD — written locally; Drive sync, sharing, and saved-copy contents are not verified by this adapter.\n';
}

function coreContent(file, clientName, project, mode) {
  const base = `# ${file.replace(/\.md$/, '')}\n\n${recordLabel(mode)}\nClient: ${clientName}\nProject: ${project.name} (${project.id})\n`;
  if (file === '00 Start Here.md') return `${base}\nThis folder is the single shared home for this client project. The repository holds reusable rules and blank templates; this folder holds client-specific records.\n\n- Project record: [01 Project Register.md](./01%20Project%20Register.md)\n- Issue and fix log: [02 Issue and Fix Log.md](./02%20Issue%20and%20Fix%20Log.md)\n- Reports: [reports](./reports/)\n- Saved project-copy pointers: [project-backups](./project-backups/)\n\nDrive assumption: this is an explicit local path that may later be inside a Drive-synced folder. Sync and sharing permissions are not checked by this local adapter.\n`;
  if (file === '01 Project Register.md') return `${frontMatter({ record_type: 'Project Register', project_id: project.id, project_label: project.name, claude_account: 'not yet provided', source_list: 'not yet provided', saved_copy_location: project.savedCopyLocation || 'not yet provided', project_purpose: 'not yet provided', status: 'active', owner: 'not yet provided', trusted_source_reference: 'not yet provided' })}${base}\n## Project\n\n- Project ID: ${project.id}\n- Project label: ${project.name}\n- Claude account: not yet provided\n- Source list: not yet provided\n- Saved-copy pointer: ${project.savedCopyLocation || 'not yet provided'}\n- Project purpose: not yet provided\n- Status: active\n- Owner: not yet provided\n- Trusted source reference: not yet provided\n\nThe saved-copy entry is only a pointer supplied by the caller. This adapter does not find, copy, read, or verify a Claude Project backup.\n`;
  if (file === '02 Issue and Fix Log.md') return `${base}\nEach issue file must name its project ID, report links, and saved-copy pointer.\n\n## Issues\n\nNo issues recorded yet.\n`;
  if (file === '03 Trusted Sources.md') return `${base}\nNo trusted sources recorded yet.\n`;
  return `${base}\nNo test records recorded yet.\n`;
}

function datedName(date, title, suffix) {
  const day = date instanceof Date ? date.toISOString().slice(0, 10) : date;
  return `${day} ${safePart(title, 'Record title')}${suffix}.md`;
}

function parseFrontMatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/m)?.[1];
  if (!block) return {};
  return Object.fromEntries(block.split('\n').map((line) => line.match(/^([^:]+):\s*(.*)$/)).filter(Boolean).map(([, key, value]) => [key.trim(), value.trim()]));
}

async function filesUnder(directory) {
  try { return (await readdir(directory, { withFileTypes: true })).flatMap((entry) => entry.isDirectory() ? [] : [path.join(directory, entry.name)]); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function inspectRecords(root) {
  const errors = [];
  const records = [];
  const add = async (file, expectedType) => {
    const text = await readFile(file, 'utf8');
    const blocks = [...text.matchAll(/^---\n([\s\S]*?)\n---/gm)].map((match) => parseFrontMatter(match[0]));
    const idField = ID_FIELDS[expectedType];
    if (!blocks.length) {
      errors.push(`Malformed ${expectedType} record: ${path.relative(root, file)}`);
      return;
    }
    for (const fields of blocks) {
      if (fields.record_type !== expectedType || !fields[idField]) {
        errors.push(`Malformed ${expectedType} record: ${path.relative(root, file)}`);
        if (!fields[idField]) continue;
      }
      records.push({ file, text, fields, type: expectedType, id: fields[idField] });
    }
  };
  await add(path.join(root, '01 Project Register.md'), 'Project Register').catch((error) => { if (error.code !== 'ENOENT') throw error; });
  for (const [directory, fallbackType] of [['issues', 'Issue & Fix Log'], ['reports', 'Health Report'], ['releases', 'Release Record']]) {
    for (const file of await filesUnder(path.join(root, directory))) {
      const text = await readFile(file, 'utf8');
      const actualType = text.match(/^record_type:\s*(.+)$/m)?.[1]?.trim() || fallbackType;
      await add(file, actualType);
    }
  }
  const seen = new Map();
  for (const record of records) {
    const key = `${record.type}:${record.id}`;
    if (seen.has(key)) {
      const label = record.type === 'Issue & Fix Log' ? 'issue' : record.type === 'Project Register' ? 'project' : record.type;
      errors.push(`Duplicate ${label} ID: ${record.id} (${path.relative(root, seen.get(key))} and ${path.relative(root, record.file)}).`);
    }
    else seen.set(key, record.file);
  }
  const projectIds = new Set(records.filter((record) => record.type === 'Project Register').map((record) => record.id));
  for (const record of records.filter((item) => item.type !== 'Project Register')) {
    const projectId = record.fields.project_id || record.fields.target_project_id;
    if (projectId && !projectIds.has(projectId)) errors.push(`Unknown project reference: ${projectId} in ${path.relative(root, record.file)}.`);
  }
  return { errors, records, projectIds };
}

export async function validateControlCenter(outputDir, { projectIds = [], repoRoot } = {}) {
  await assertSafeOutputPath(outputDir, { repoRoot });
  const root = path.resolve(outputDir);
  const errors = [];
  for (const file of CORE_FILES) { try { await access(path.join(root, file)); } catch { errors.push(`Missing core file: ${file}`); } }
  for (const directory of CORE_DIRECTORIES) { try { if (!(await lstat(path.join(root, directory))).isDirectory()) errors.push(`Core path is not a folder: ${directory}`); } catch { errors.push(`Missing core folder: ${directory}`); } }
  const inspected = await inspectRecords(root);
  errors.push(...inspected.errors);
  const templateDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../templates/troubleshooting');
  const definitions = await loadTemplateDefinitions(templateDir);
  errors.push(...validateRecordCollection(inspected.records.map((record) => record.fields), definitions));
  const known = new Set([...projectIds, ...inspected.projectIds]);
  for (const record of inspected.records.filter((item) => item.type !== 'Project Register')) {
    const projectId = record.fields.project_id || record.fields.target_project_id;
    if (projectId && !known.has(projectId)) errors.push(`Unknown project reference: ${projectId} in ${path.relative(root, record.file)}.`);
  }
  return [...new Set(errors)];
}

async function writeOnce(file, content) {
  try {
    const existing = await readFile(file, 'utf8');
    if (existing !== content) throw new Error(`Control Center conflict: existing record differs: ${path.basename(file)}.`);
    return { file, created: false };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(file, content, 'utf8');
    return { file, created: true };
  }
}

function requestedIds({ project, issues, reports, releases }) {
  const entries = [['Project Register', project.id], ...issues.map((item) => ['Issue & Fix Log', item.issueId]), ...reports.map((item) => ['Health Report', item.reportId || 'REPORT-FAKE']), ...releases.map((item) => ['Release Record', item.releaseId || 'RELEASE-FAKE'])];
  const seen = new Set();
  for (const [type, id] of entries) {
    const key = `${type}:${id}`;
    if (seen.has(key)) throw new Error(`Duplicate ${type} ID in setup input: ${id}.`);
    seen.add(key);
  }
}

export async function setupControlCenter({ outputDir, clientName, project, issues = [], reports = [], releases = [], mode, repoRoot }) {
  if (!['fake', 'approved'].includes(mode)) throw new Error('Setup mode must be explicit: use fake for local tests or approved for an approved client folder.');
  safePart(clientName, 'Client name');
  if (!project?.id || !project?.name) throw new Error('A project ID and project name are required.');
  safePart(project.id, 'Project ID'); safePart(project.name, 'Project name');
  requestedIds({ project, issues, reports, releases });
  for (const issue of issues) { safePart(issue.issueId, 'Issue ID'); safePart(issue.title, 'Issue title'); if (issue.projectId !== project.id) throw new Error(`Issue ${issue.issueId} references unknown project ${issue.projectId}.`); }
  for (const report of reports) safePart(report.title, 'Report title');
  for (const release of releases) safePart(release.title, 'Release title');
  await assertSafeOutputPath(outputDir, { repoRoot });
  const root = path.resolve(outputDir);
  let inspected = { errors: [], records: [] };
  try { inspected = await inspectRecords(root); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const existingCore = (await Promise.all(CORE_FILES.map(async (file) => { try { await access(path.join(root, file)); return true; } catch { return false; } }))).some(Boolean);
  const existingRecordFiles = (await Promise.all(['issues', 'reports', 'releases'].map((directory) => filesUnder(path.join(root, directory))))).some((files) => files.length > 0);
  const hasExistingContent = inspected.records.length > 0 || existingCore || existingRecordFiles;
  if (hasExistingContent) {
    const existingValidationErrors = await validateControlCenter(root, { repoRoot });
    if (existingValidationErrors.length) throw new Error(`Control Center conflict: ${existingValidationErrors.join(' ')}`);
  }
  const existingById = new Map(inspected.records.map((record) => [`${record.type}:${record.id}`, record]));
  const checkRequested = (type, id, content, target) => {
    const existing = existingById.get(`${type}:${id}`);
    if (existing && existing.text !== content) throw new Error(`Control Center conflict: existing ${type} ${id} differs from the requested record.`);
    if (existing && target && path.resolve(existing.file) !== path.resolve(target)) throw new Error(`Control Center conflict: existing ${type} ${id} has a different record name.`);
    return existing;
  };
  await mkdir(root, { recursive: true });
  for (const directory of CORE_DIRECTORIES) await mkdir(path.join(root, directory), { recursive: true });
  const results = [];
  for (const file of CORE_FILES) {
    const content = coreContent(file, clientName, project, mode);
    if (file === '01 Project Register.md') checkRequested('Project Register', project.id, content);
    results.push(await writeOnce(path.join(root, file), content));
  }
  for (const issue of issues) {
    const file = datedName(issue.date || new Date(), `${issue.issueId} ${issue.title}`, '');
    const target = path.join(root, 'issues', file);
    const content = `${frontMatter({ record_type: 'Issue & Fix Log', issue_id: issue.issueId, symptoms: issue.symptoms || issue.title, proven_root_cause: issue.provenRootCause || 'not yet provided', solution: issue.solution || 'not yet provided', permanent_check: issue.permanentCheck || 'not yet provided', resolution_date: issue.resolutionDate || 'not resolved', evidence_reference: issue.evidenceReference || 'not yet provided', impact: issue.impact || 'not yet provided', owner: issue.owner || 'not yet provided', status: issue.status || 'open', project_id: issue.projectId })}# ${issue.issueId}: ${issue.title}\n\n${recordLabel(mode)}\nProject: [${project.name}](../01%20Project%20Register.md)\nReports: ${(issue.reportFiles || []).map((name) => `[${name}](../reports/${encodeURIComponent(name)})`).join(', ') || 'None yet'}\nSaved-copy pointer: ${issue.savedCopyLocation || project.savedCopyLocation || 'Not supplied'} (not copied or verified)\nStatus: ${issue.status || 'open'}\n`;
    const existing = checkRequested('Issue & Fix Log', issue.issueId, content, target);
    results.push(existing ? { file: existing.file, created: false } : await writeOnce(target, content));
  }
  for (const report of reports) {
    const id = report.reportId || 'REPORT-FAKE';
    const target = path.join(root, 'reports', datedName(report.date || new Date(), report.title, ' Health Report'));
    const reportDate = report.date || new Date().toISOString().slice(0, 10);
    const content = `${frontMatter({ record_type: 'Health Report', report_id: id, report_date: reportDate, scope: report.scope || project.name, overall_status: report.overallStatus || 'not checked', known: report.known || 'not yet provided', unknown: report.unknown || 'not yet provided', next_owner: report.nextOwner || 'not yet provided', next_action: report.nextAction || 'not yet provided', project_id: project.id })}# ${report.title}\n\n${recordLabel(mode)}\nProject: [${project.name}](../01%20Project%20Register.md)\nSaved-copy pointer: ${report.savedCopyLocation || project.savedCopyLocation || 'Not supplied'} (not copied or verified)\n`;
    const existing = checkRequested('Health Report', id, content, target);
    results.push(existing ? { file: existing.file, created: false } : await writeOnce(target, content));
  }
  for (const release of releases) {
    const id = release.releaseId || 'RELEASE-FAKE';
    const target = path.join(root, 'releases', datedName(release.date || new Date(), release.title, ' Release Record'));
    const releaseDate = release.date || new Date().toISOString().slice(0, 10);
    const content = `${frontMatter({ record_type: 'Release Record', release_id: id, target_project_id: project.id, change_summary: release.changeSummary || 'not yet provided', approved_file_list: release.approvedFileList || 'not yet provided', included_records: release.includedRecords || 'not yet provided', verification_status: release.verificationStatus || 'not checked', check_method: release.checkMethod || 'not yet provided', checked_by: release.checkedBy || 'not yet provided', checked_on: release.checkedOn || 'not yet provided', evidence_reference: release.evidenceReference || 'not yet provided', post_update_comparison_result: release.postUpdateComparisonResult || 'not run', client_email_required: release.clientEmailRequired || 'no', approver: release.approver || 'not yet provided', release_date: releaseDate, rollback_action: release.rollbackAction || 'not yet provided' })}# ${release.title}\n\n${recordLabel(mode)}\nProject: [${project.name}](../01%20Project%20Register.md)\nSaved-copy pointer: ${release.savedCopyLocation || project.savedCopyLocation || 'Not supplied'} (not copied or verified)\n`;
    const existing = checkRequested('Release Record', id, content, target);
    results.push(existing ? { file: existing.file, created: false } : await writeOnce(target, content));
  }
  return { root, results, created: results.filter((item) => item.created).map((item) => item.file), reused: results.filter((item) => !item.created).map((item) => item.file) };
}

export async function writeHealthReport({ outputDir, project, report, mode = 'fake', repoRoot }) {
  if (!report?.reportId || !report?.title) throw new Error('A Health Report needs an ID and title.');
  if (!['fake', 'approved'].includes(mode)) throw new Error('Report mode must be explicit: use fake or approved.');
  await assertSafeOutputPath(outputDir, { repoRoot });
  const root = path.resolve(outputDir);
  const projectRegister = await readFile(path.join(root, '01 Project Register.md'), 'utf8');
  if (!projectRegister.includes(`project_id: ${project.id}`)) throw new Error(`Unknown project reference: ${project.id}.`);
  const target = path.join(root, 'reports', datedName(report.date, `${report.reportId} ${report.title}`, ' Health Report'));
  const content = `${frontMatter({ record_type: 'Health Report', report_id: report.reportId, report_date: report.date, scope: report.scope, overall_status: report.overallStatus, known: report.known, unknown: report.unknown, next_owner: report.nextOwner, next_action: report.nextAction, check_method: report.checkMethod, evidence_reference: report.evidenceReference, checked_by: report.checkedBy, checked_on: report.checkedOn, project_id: project.id })}# ${report.title}\n\n${recordLabel(mode)}\nProject: [${project.name}](../01%20Project%20Register.md)\nSaved-copy pointer: ${project.savedCopyLocation || 'not supplied'} (not copied or verified)\n`;
  const result = await writeOnce(target, content);
  const errors = await validateControlCenter(root, { repoRoot });
  if (errors.length) throw new Error(`Generated Health Report failed canonical validation: ${errors.join(' ')}`);
  return { root, report, ...result };
}

export async function writeInvestigationRecords({ outputDir, project, issue, card, healthReport, dataReport, developerTicket, mode = 'fake', repoRoot }) {
  if (!issue?.issueId || !card?.cardId) throw new Error('An investigation needs one issue ID and one Troubleshooting Card ID.');
  const root = path.resolve(outputDir);
  const validationErrors = await validateControlCenter(root, { repoRoot });
  if (validationErrors.length) throw new Error(`Control Center conflict: ${validationErrors.join(' ')}`);
  const projectRegister = await readFile(path.join(root, '01 Project Register.md'), 'utf8');
  if (!projectRegister.includes(`project_id: ${project.id}`)) throw new Error(`Unknown project reference: ${project.id}.`);
  const records = [];
  const put = async (directory, date, title, type, id, fields, body) => {
    const target = path.join(root, directory, datedName(date, `${id} ${title}`, ''));
    const content = `${frontMatter({ record_type: type, ...fields })}# ${title}\n\n${recordLabel(mode)}\nProject: [${project.name}](../01%20Project%20Register.md)\nSaved-copy pointer: ${project.savedCopyLocation || 'not supplied'} (not copied or verified)\n\n${body}\n`;
    const existing = await filesUnder(path.join(root, directory));
    const matching = [];
    for (const file of existing) {
      const text = await readFile(file, 'utf8');
      const parsed = parseFrontMatter(text);
      if (parsed.record_type === type && parsed[ID_FIELDS[type]] === id) matching.push({ file, text });
    }
    if (matching.length > 1) throw new Error(`Duplicate ${type} ID: ${id}.`);
    if (matching.length && matching[0].text !== content) throw new Error(`Control Center conflict: existing ${type} ${id} differs.`);
    records.push(matching.length ? { file: matching[0].file, created: false } : await writeOnce(target, content));
  };
  await put('issues', issue.date, issue.title, 'Issue & Fix Log', issue.issueId, {
    issue_id: issue.issueId, symptoms: issue.symptoms, proven_root_cause: issue.provenRootCause, solution: issue.solution,
    permanent_check: issue.permanentCheck, resolution_date: issue.resolutionDate || 'not resolved', evidence_reference: issue.evidenceReference,
    impact: issue.impact, owner: issue.owner, status: issue.status, project_id: project.id,
  }, `Reports: ${issue.reportLinks || 'None'}\nTroubleshooting Card: ${card.cardId}\n`);
  await put('issues', card.date, card.title, 'Troubleshooting Card', card.cardId, {
    card_id: card.cardId, question: card.question, current_answer: card.currentAnswer, likely_causes: card.likelyCauses,
    tests_attempted: card.testsAttempted, results: card.results, ruled_out_causes: card.ruledOutCauses, remaining_theories: card.remainingTheories,
    check_method: card.checkMethod || 'not run', evidence_reference: card.evidenceReference, status: card.status, checked_by: card.checkedBy || 'not yet checked',
    checked_on: card.checkedOn || 'not yet checked', next_owner: card.nextOwner, next_action: card.nextAction, project_id: project.id,
  }, `Issue: ${issue.issueId}\n${card.detail || ''}`);
  if (healthReport) await put('reports', healthReport.date, healthReport.title, 'Health Report', healthReport.reportId, {
    report_id: healthReport.reportId, report_date: healthReport.date, scope: healthReport.scope, overall_status: healthReport.overallStatus,
    known: healthReport.known, unknown: healthReport.unknown, next_owner: healthReport.nextOwner, next_action: healthReport.nextAction, project_id: project.id,
  }, `Troubleshooting Card: ${card.cardId}`);
  if (dataReport) await put('reports', dataReport.date, dataReport.title, 'Data Integrity Report', dataReport.reportId, {
    report_id: dataReport.reportId, data_area: dataReport.dataArea, check_method: dataReport.checkMethod, finding: dataReport.finding,
    evidence_reference: dataReport.evidenceReference, status: dataReport.status, checked_by: dataReport.checkedBy || 'not yet checked', checked_on: dataReport.checkedOn || 'not yet checked',
    owner: dataReport.owner, next_action: dataReport.nextAction, project_id: project.id,
  }, `Issue: ${issue.issueId}\nPlain-language impact: ${dataReport.impact}\nExact correction: ${dataReport.correction}\nRecheck: ${dataReport.recheck}`);
  if (developerTicket) await put('issues', developerTicket.date, developerTicket.title, 'Developer Ticket', developerTicket.ticketId, {
    ticket_id: developerTicket.ticketId, problem: developerTicket.problem, expected_behavior: developerTicket.expectedBehavior, proposed_change: developerTicket.proposedChange,
    acceptance_check: developerTicket.acceptanceCheck, owner: developerTicket.owner, priority: developerTicket.priority, project_id: project.id,
  }, `Issue: ${issue.issueId}\nAttempted tests: ${developerTicket.attemptedTests}\nEvidence: ${developerTicket.evidence}\nRuled-out causes: ${developerTicket.ruledOutCauses}\nRemaining theories: ${developerTicket.remainingTheories}`);
  const finalErrors = await validateControlCenter(root, { repoRoot });
  if (finalErrors.length) throw new Error(`Generated records failed canonical validation: ${finalErrors.join(' ')}`);
  return { root, records, created: records.filter((r) => r.created).map((r) => r.file), reused: records.filter((r) => !r.created).map((r) => r.file) };
}
