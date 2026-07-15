export const meta = {
  name: 'security-audit',
  description: 'Security audit of the API — fan out finders across vuln classes, adversarially verify each finding, synthesize a ranked report',
  whenToUse: 'When you want a thorough, multi-agent security review of packages/api (or a scoped path passed via args).',
  phases: [
    { title: 'Scope' },
    { title: 'Find' },
    { title: 'Verify' },
    { title: 'Report' },
  ],
};

// args: optional string — a path/glob to scope the audit. Defaults to the whole API.
const SCOPE = typeof args === 'string' && args.trim() ? args.trim() : 'packages/api/src';

const FINDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'file', 'line', 'severity', 'description', 'exploit', 'fix'],
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
          description: { type: 'string' },
          exploit: { type: 'string', description: 'Concrete attacker input/state -> impact' },
          fix: { type: 'string' },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isReal', 'confidence', 'reasoning', 'correctedSeverity'],
  properties: {
    isReal: { type: 'boolean' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning: { type: 'string' },
    correctedSeverity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
  },
};

// Vuln classes tailored to this stack: Express + TypeORM + SQLite, JWT auth,
// Joi validation, per-user soft-delete, bcrypt, node-cron, serves UI static export.
const DIMENSIONS = [
  {
    key: 'authz-idor',
    prompt: `You are auditing ${SCOPE} for BROKEN ACCESS CONTROL and IDOR.
This API nests every protected route under /api/users/:userId/... guarded by requireAuth.
Hunt for: (1) routes missing the requireAuth guard; (2) services/repositories that query or
mutate by resource id WITHOUT scoping to the authenticated req.user id (an attacker passing
another user's :userId or resource id reads/writes their data); (3) soft-delete or update calls
not scoped to userId; (4) trusting :userId from the path instead of req.user. Read middleware/auth.ts,
routes/*.routes.ts and their sub-routes, and every *.service.ts / *.repository.ts. Report each real gap.`,
  },
  {
    key: 'injection',
    prompt: `You are auditing ${SCOPE} for INJECTION.
TypeORM + better-sqlite3. Hunt for: raw SQL via query()/createQueryBuilder with string
concatenation or interpolation of user input; unparameterized where clauses; unsafe use of
user input in file paths (backup.service), shell, or dynamic property access. Also check the
prompt.service / wizard routes for prompt-injection sinks. Report each real injection sink.`,
  },
  {
    key: 'auth-crypto',
    prompt: `You are auditing ${SCOPE} for AUTHENTICATION & CRYPTO weaknesses.
JWT (30-day expiry) + bcrypt. Read auth.service.ts and middleware/auth.ts. Hunt for: hardcoded
or weak JWT secret / fallback secret; missing signature or expiry verification; algorithm confusion
(alg:none); tokens logged; weak bcrypt cost; timing-unsafe comparisons; password/reset flows that
leak account existence; missing rate limit on login (check middleware/rate-limit.ts). Report each finding.`,
  },
  {
    key: 'validation-massassign',
    prompt: `You are auditing ${SCOPE} for INPUT VALIDATION & MASS ASSIGNMENT.
Convention: routes validate bodies with Joi; services must selectively persist fields, never save the
raw client payload. Hunt for: routes with no/loose Joi schema; services that spread req.body or an
input DTO straight into repository.save/create/update (mass assignment); type coercion holes; missing
validation on query/params (pagination, ids). Report each field/route that trusts client input unsafely.`,
  },
  {
    key: 'secrets-config-disclosure',
    prompt: `You are auditing ${SCOPE} (and repo root config) for SECRETS & INFO DISCLOSURE.
Hunt for: secrets/keys committed in source or .env examples; secrets in log output (logger.service);
the global error handler (middleware/error-handler.ts) leaking stack traces or internal messages to
clients on non-AppError 500s; verbose errors exposing SQL/paths; CORS misconfiguration; the static UI
export serving unintended files. Report each disclosure.`,
  },
  {
    key: 'deps-misc',
    prompt: `You are auditing ${SCOPE} and the workspace for MISC & DEPENDENCY risk.
Hunt for: known-vulnerable or unpinned dependencies (check package.json + npm audit if available via Bash);
missing rate limiting on expensive endpoints (analytics, backup, prompt); unbounded query results / ReDoS
in regexes; node-cron scheduler (scheduler/recurring-scheduler.ts) executing attacker-influenced data;
path traversal in backup restore; missing auth on the MCP sqlite surface. Report each real risk.`,
  },
];

phase('Scope');
log(`Security audit scope: ${SCOPE} — ${DIMENSIONS.length} vuln classes`);

// Pipeline: each dimension is found then its findings are verified as soon as that
// dimension completes — no barrier, so fast dimensions don't wait on slow ones.
const perDimension = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(d.prompt, {
      label: `find:${d.key}`,
      phase: 'Find',
      schema: FINDING_SCHEMA,
      effort: 'high',
    }),
  (result, d) => {
    const findings = (result && result.findings) || [];
    if (!findings.length) return [];
    return parallel(
      findings.map((f) => () =>
        agent(
          `Adversarially verify this claimed ${d.key} vulnerability. Read the actual code at ${f.file}:${f.line}.
Try to REFUTE it: is the input really attacker-controlled? Is there an upstream guard (requireAuth,
Joi schema, userId scoping, parameterization) that already neutralizes it? Default to isReal=false if
uncertain. Correct the severity if the reporter over/under-rated it.

Claim: ${f.title}
Description: ${f.description}
Exploit: ${f.exploit}`,
          { label: `verify:${f.file.split('/').pop()}:${f.line}`, phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' },
        ).then((v) => ({ ...f, dimension: d.key, verdict: v })),
      ),
    );
  },
);

const confirmed = perDimension
  .flat()
  .filter(Boolean)
  .filter((f) => f.verdict && f.verdict.isReal)
  .map((f) => ({ ...f, severity: f.verdict.correctedSeverity || f.severity }));

const RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
confirmed.sort((a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9));

phase('Report');
log(`Confirmed ${confirmed.length} vulnerabilities across ${DIMENSIONS.length} classes`);

if (!confirmed.length) {
  return { scope: SCOPE, total: 0, findings: [], report: 'No confirmed vulnerabilities survived verification.' };
}

const report = await agent(
  `Write a security audit report (markdown) for scope ${SCOPE}.
Group findings by severity (critical -> info). For each: title, file:line, impact, concrete exploit,
and the concrete fix. Open with a one-paragraph executive summary and a severity count table. Be precise,
no filler. Here is the confirmed, verified finding set as JSON:

${JSON.stringify(confirmed, null, 2)}`,
  { label: 'synthesize-report', phase: 'Report', effort: 'high' },
);

return {
  scope: SCOPE,
  total: confirmed.length,
  bySeverity: confirmed.reduce((acc, f) => ((acc[f.severity] = (acc[f.severity] || 0) + 1), acc), {}),
  findings: confirmed,
  report,
};
