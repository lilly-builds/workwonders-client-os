const STAGING_PREFIX = 'STAGING — ';

export const SAFETY_QUESTIONS = [
  'Is the answer using the correct source?',
  'Does it cover all relevant pages?',
  'Does it use the cost code correctly?',
  'Does it exclude denied bills?',
  'Does it keep cost separate from price?',
];

export const OPEN_REVIEW_QUESTION = 'Does anything else look off?';

const fail = (message) => {
  throw new Error(message);
};

export const stagingTitle = (liveTitle) => {
  if (!liveTitle || typeof liveTitle !== 'string') fail('A live project title is required.');
  return `${STAGING_PREFIX}${liveTitle}`;
};

export const assertStagingTitle = (name) => {
  if (!String(name).startsWith(STAGING_PREFIX)) {
    fail(`Candidate title must start with "${STAGING_PREFIX}".`);
  }
  return true;
};

export const fileNames = (project) => {
  const names = [
    ...(project.instructions !== undefined ? ['instructions'] : []),
    ...(project.docs ?? []).map((doc) => doc.file_name),
  ];
  return names;
};

export const assertNoDuplicateFiles = (project, label = 'project') => {
  const names = fileNames(project);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length) fail(`${label} has duplicate file(s): ${[...new Set(duplicates)].join(', ')}`);
};

export const assertExactTarget = (actual, expected, label = 'target project') => {
  if (!actual || actual.uuid !== expected) fail(`Wrong ${label}: expected exact project ID ${expected}.`);
};

export const assertExistingFilesOnly = (changeSet, baseline) => {
  const allowed = new Set(fileNames(baseline));
  const items = Array.isArray(changeSet) ? changeSet : (changeSet.docs ?? []);
  const unexpected = items.filter((item) => item.file_name !== 'instructions' && !allowed.has(item.file_name));
  if (unexpected.length) fail(`Unexpected file(s): ${unexpected.map((item) => item.file_name).join(', ')}`);
};

export const compareFileLists = (actual, expected, label) => {
  const a = [...fileNames(actual)].sort();
  const e = [...fileNames(expected)].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) fail(`${label} file list does not match the approved baseline.`);
};

export const assertCandidateLink = (candidate, liveId) => {
  assertStagingTitle(candidate.name);
  if (candidate.source_live_project_id !== liveId) fail('Candidate is not linked to the exact live project.');
  if (candidate.uuid === liveId) fail('Candidate and live project must have different IDs.');
};

export const assertRequiredComponents = (candidate, baseline, required = []) => {
  const names = new Set(fileNames(candidate));
  const missing = [...new Set([...required, ...fileNames(baseline)])].filter((name) => !names.has(name));
  if (missing.length) fail(`Candidate is missing required component(s): ${missing.join(', ')}`);
};

export const assertAccountSkillsChecked = ({ required, candidateChecked, liveChecked }) => {
  if (required && (!candidateChecked || !liveChecked)) {
    fail('Account-level Skills are not checked in both candidate and live projects.');
  }
};

export const assertExplicitApproval = (approval, reviewer = 'Lilly') => {
  if (!approval || approval.reviewer !== reviewer || approval.decision !== 'approved') {
    fail(`${reviewer} approval is required before any write.`);
  }
};

export const assertBehaviorResult = (result, stage) => {
  if (!result || result.status === 'not-run') fail(`${stage} behavior tests were not run.`);
  if (result.status === 'failed') fail(`${stage} behavior tests failed.`);
  if (result.status !== 'passed') fail(`${stage} behavior tests have no passing result.`);
  if (result.open_question_reviewed !== true) fail(`${stage} requires human review of "${OPEN_REVIEW_QUESTION}".`);
};

export const assertFreshComparison = (comparison, stage) => {
  if (!comparison || comparison.fresh !== true || comparison.matches !== true) {
    fail(`${stage} fresh comparison did not match the intended files.`);
  }
};
