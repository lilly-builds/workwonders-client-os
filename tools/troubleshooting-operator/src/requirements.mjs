const allowed = new Set(['passed', 'failed', 'partly working', 'not tested']);
const clean = (value) => String(value ?? '').trim();

export const createRequirementChecklist = (requirements = []) => requirements.map((requirement, index) => {
  const text = clean(requirement.text ?? requirement);
  if (!text) throw new Error(`Requirement ${index + 1} needs plain-language text.`);
  return { id: clean(requirement.id) || `REQ-${index + 1}`, text, status: 'not tested', evidence: null, source: null, attempts: [] };
});

export const recordRequirementResult = (checklist, { id, status, evidence, source, attempt = 1 }) => {
  if (!allowed.has(status)) throw new Error(`Unknown requirement result: ${status}.`);
  const item = checklist.find((requirement) => requirement.id === id);
  if (!item) throw new Error(`Unknown requirement: ${id}.`);
  if (status === 'passed' && (!clean(evidence) || !clean(source))) throw new Error('A passed requirement needs both evidence and a named source.');
  if (attempt > 2) throw new Error('Stop after two failed attempts and ask for the next owner.');
  const updated = { ...item, status, evidence: clean(evidence) || null, source: clean(source) || null, attempts: [...item.attempts, { attempt, status, evidence: clean(evidence) || null, source: clean(source) || null }] };
  return checklist.map((requirement) => requirement.id === id ? updated : requirement);
};

export const scoreRequirements = (checklist) => {
  const counts = Object.fromEntries([...allowed].map((status) => [status, checklist.filter((item) => item.status === status).length]));
  const overall_status = counts.failed ? 'failed' : counts['partly working'] ? 'partly working' : counts['not tested'] ? 'not ready' : 'passed';
  return {
    overall_status,
    counts,
    passed: checklist.filter((item) => item.status === 'passed').map((item) => item.id),
    not_proven: checklist.filter((item) => item.status !== 'passed').map((item) => ({ id: item.id, status: item.status, reason: item.evidence || 'No checkable evidence was recorded.' })),
  };
};
