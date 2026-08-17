const clean = (value) => String(value ?? '').trim();

export const assessConnectorReadiness = ({ requested = [], connectors = [] } = {}) => {
  const byName = new Map(connectors.map((connector) => [connector.name, connector]));
  const checks = requested.map((request) => {
    const name = typeof request === 'string' ? request : request.name;
    const expectedTenant = typeof request === 'string' ? undefined : request.expected_tenant;
    const connector = byName.get(name);
    if (!connector) return { name, status: 'blocked', reason: 'is not configured for this pilot' };
    if (connector.status !== 'ready') return { name, status: 'blocked', reason: connector.reason || 'is not ready' };
    if (expectedTenant && connector.tenant !== expectedTenant) return { name, status: 'blocked', reason: `is pointed at ${clean(connector.tenant) || 'an unknown tenant'}, not ${expectedTenant}` };
    return { name, status: 'ready', reason: 'is ready for the named check' };
  });
  const blocked = checks.filter((check) => check.status === 'blocked');
  if (!blocked.length) return { status: 'ready', checks, plain_summary: 'The connectors named in this ticket are ready for the next check.', operator_question: null };
  const first = blocked[0];
  return {
    status: 'blocked',
    checks,
    plain_summary: `${first.name} ${first.reason}. I will not treat its results as trustworthy.`,
    operator_question: `Who can confirm or fix the ${first.name} connection for this request?`,
  };
};
