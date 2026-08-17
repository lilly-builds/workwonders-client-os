const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const asComment = (comment, index) => {
  if (typeof comment === 'string') return { id: `comment-${index + 1}`, body: clean(comment), created_at: null };
  return { id: clean(comment?.id) || `comment-${index + 1}`, body: clean(comment?.body ?? comment?.content), created_at: comment?.created_at ?? null };
};

export const intakeTicket = ({ card_body = '', comments = [] } = {}) => {
  const body = clean(card_body);
  const usableComments = comments.map(asComment).filter((comment) => comment.body);
  const sources = [
    ...(body ? [{ place: 'card body', text: body }] : []),
    ...usableComments.map((comment) => ({ place: `comment ${comment.id}`, text: comment.body })),
  ];
  const primary = usableComments.at(-1) ? { place: `comment ${usableComments.at(-1).id}`, text: usableComments.at(-1).body } : sources[0];
  return {
    status: primary ? 'ready' : 'needs input',
    request_text: primary?.text ?? null,
    request_location: primary?.place ?? null,
    sources_read: sources.map((source) => source.place),
    source_count: sources.length,
  };
};

export const nextOperatorMove = ({ ticket, evidence_home, connector_readiness, failed_attempts = 0, next_owner = 'Lilly' } = {}) => {
  if (!ticket || ticket.status !== 'ready') {
    return {
      status: 'needs input',
      action: 'read the request',
      message: 'I’m starting with the ticket. I checked the card and its comments, but I could not find the request.',
      question: 'What did you expect the project to do, and what happened instead?',
    };
  }
  if (!clean(evidence_home)) {
    return {
      status: 'needs input',
      action: 'find the evidence home',
      message: 'I’m starting with the existing request. I’m checking where to save the test evidence now. I could not find the approved Drive folder.',
      question: 'Can you send the direct link to the Work Wonders pilot or troubleshooting folder?',
    };
  }
  if (connector_readiness?.status === 'blocked') {
    return {
      status: 'blocked',
      action: 'check the named connector',
      message: `I’m checking the connector needed for this request. ${connector_readiness.plain_summary}`,
      question: connector_readiness.operator_question,
    };
  }
  if (failed_attempts >= 2) {
    return {
      status: 'needs owner',
      action: 'stop repeated attempts',
      message: 'I tried the two safe checks available for this request and neither gave us a clear answer. I am stopping here instead of guessing.',
      question: `Can ${next_owner} choose the next path: provide the missing evidence or assign this for deeper review?`,
    };
  }
  return {
    status: 'ready',
    action: 'run the first requirement check',
    message: `I’m starting with the request from the ${ticket.request_location}. I’m checking the first stated requirement now.`,
    question: null,
  };
};

export const oneQuestionOnly = (move) => {
  if (!move?.question) return true;
  return !/[?].+\?/s.test(move.question);
};
