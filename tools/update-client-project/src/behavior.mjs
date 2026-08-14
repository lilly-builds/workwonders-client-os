import { OPEN_REVIEW_QUESTION, SAFETY_QUESTIONS } from './guards.mjs';

export const behaviorContract = ({ originalProblemQuestion, expectedResults, allowedTestData, evidenceLocation, reviewer = 'Lilly' }) => ({
  original_problem_question: originalProblemQuestion,
  safety_questions: SAFETY_QUESTIONS,
  open_question: OPEN_REVIEW_QUESTION,
  expected_results: expectedResults,
  allowed_test_data: allowedTestData,
  response_evidence_location: evidenceLocation,
  reviewer,
  pass_rules: [
    'Every fixed question has a response matching its expected result.',
    'No fixed question is skipped or substituted.',
    'The open question is reviewed by Lilly; it is a discovery signal, not a standalone pass/fail test.',
  ],
  fail_rules: [
    'Any fixed question fails or is not run.',
    'The open question surfaces an unresolved concern.',
    'The required response evidence is missing.',
  ],
});

export const evaluateBehavior = (contract, responses = {}) => {
  const fixedQuestions = [contract.original_problem_question, ...contract.safety_questions];
  const missing = fixedQuestions.filter((question) => !responses[question]);
  const failed = fixedQuestions.filter((question) => {
    const response = responses[question];
    const expected = contract.expected_results[question];
    return response && expected !== undefined && response.result !== expected;
  });
  const open = responses[contract.open_question];
  return {
    status: missing.length || failed.length ? 'failed' : 'passed',
    missing_questions: missing,
    failed_questions: failed,
    open_question_reviewed: open?.reviewed === true,
    open_question_concern: open?.concern ?? null,
    responses,
    questions_run: fixedQuestions,
  };
};
