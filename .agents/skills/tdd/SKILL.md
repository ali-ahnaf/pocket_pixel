---
name: tdd
description: Use ONLY when the user explicitly asks for TDD, test-first, red/green, or "write failing tests first" (or invokes /tdd). Drives one failing Jest test at a time for API services in packages/api, then implements. Do NOT use for a plain spec, feature or bug request that does not name a test-first approach; implement those normally.
---

# TDD in this repo

One rule above all others: the test is the specification. Implementation changes to satisfy the test, never the reverse. If a test looks wrong, stop and raise it with the user as a spec question. Editing a test to make it pass destroys the only evidence the code works.

For layering and conventions (route, service, repository, entity; `AppError`; `asyncHandler`; shared DTOs; migrations), follow the root `CLAUDE.md` and `.agents/rules/typescript.md`. Do not restate them here. `.agents/rules/testing.md` also applies: fix code, not tests, unless the behaviour is intentionally changing.

## Where tests go

- API logic: Jest unit tests in `packages/api/src/tests/<name>.service.test.ts`. `jest.config.js` only scans `src/tests/**/*.test.ts`. Only services are unit-tested; repositories are mocked, and routes are thin so they get no direct test. Follow the existing pattern in `tags.service.test.ts` and the `write-service-test` skill for mock and factory shape.
- UI logic and components: Vitest (`*.test.ts(x)` next to the source under `packages/ui/src`, run with `npm run test:ui:unit`).
- UI flows (auth, redirects): Playwright specs in `packages/ui/e2e/`. Add one only when the behaviour is a user flow; they are slow, so do not use them for the red/green loop.

The loop below is written for API services. For UI units, swap the command for `npm run test:ui:unit -- <path> -t "<title>"`.

All commands run from the repo root.

## Reusable logic (assumption)

The long-term plan is an offline-first Expo app in `packages/app` with local SQLite and no API server. That package does not exist yet, and this is an assumption about direction, not a current rule. Where logic is likely to be reused on device (calculations, validation, parsing), put the test on pure functions or a service with injected dependencies, and do not make the test depend on Express, HTTP or `req`/`res`.

## Vertical slicing: the loop

Do not write all the tests, then all the code. Bulk-written tests describe imagined behaviour and, when context gets tight, invite rewriting tests instead of code.

One `it` per cycle, each cycle closed before the next opens:

```
cycle 1:  write test 1  ->  run (RED)  ->  implement  ->  run (GREEN)  ->  refactor
cycle 2:  write test 2  ->  run (RED)  ->  implement  ->  run (GREEN)  ->  refactor
```

Rules of the loop:

- One `it` at a time. Never add the next test while the current one is red.
- Run just that test so the signal is unambiguous:
  ```bash
  npm run test:api -- tags.service -t "<exact it title>"
  ```
  `-t` is a substring/regex match. Make titles distinct enough to select one test.
- Run the whole file at the end of each cycle once more than one test exists. A new implementation must not break an earlier green.
- Implement only what the current test demands. Anticipated code is untested code.
- Each cycle leaves the file green, so it is a safe stopping point.

Suggested slice order for a service method:

1. Happy path: returns the expected shape (the shared DTO) for valid input.
2. Persistence: the repository is called with the right fields. Only selected fields are saved, never the raw client payload.
3. Ownership: data is scoped by `userId`; another user's record is not found.
4. Domain errors: each `AppError` message and status code, one cycle each.
5. Boundaries: empty, min, max, max+1, wrong type where the service sees them. Joi validation lives in the route and is not unit-tested; test only what the service enforces.

If the user hands over a whole test file, that is a specification, not a licence to implement horizontally. Get the file fully red, then work it one `it` at a time with `-t`.

## 1. Plan before any code

Answer these in a short message to the user (or scratch notes for anything spanning 3+ files, per `.agents/rules/loop-engineering.md`):

1. What interface changes are needed? Which service and repository methods appear or change, and whether a shared contract, entity or migration is involved.
2. Which behaviours matter most? Rank: contract of the method, ownership and authorization, error cases, boundaries. Skip trivia.
3. What is observable? Return values, thrown `AppError` (message and status code), and calls on the mocked repository at the boundary. Not private helpers or call order inside the service.
4. What is the termination condition? "Done" is a named set of tests passing, nothing more.

If the source is a spec or ticket, restate it as numbered, verifiable rules first: exact limits, every error message and status code.

## 2. RED: write one test, watch it fail for the right reason

Write a single `it`, then run it. A test you have not seen fail is not a test.

- Read the failure. It must fail because the behaviour is missing (method not defined, wrong return, no throw), not because of a typo, a missing import or a missing `jest.mock('../services', ...)` for the logger.
- A new method that does not exist yet fails type-checking under ts-jest. That counts as red, but stub the signature minimally so the test then fails on behaviour, and confirm that failure.
- Refuse vacuous greens. A test that passes before the feature exists proves nothing. Common traps:
  - Asserting `rejects.toThrow()` with no message or `AppError` status. Any error satisfies it.
  - Asserting a repository method was not called when the method never ran.
  - Mocks that return the same value the test expects regardless of the code.

The gate: the run of the new test reports 1 failed, for the reason you expect. Anything green before the code exists is vacuous; tighten it.

## 3. GREEN: implement the current test only, never touch the test

Follow the `CLAUDE.md` layering. If the change needs an entity change, run `npm run migration:generate` and then `npm run migration:run` (see the `migration` skill). If it needs a shared DTO, edit `packages/shared/src/contracts/` and run `npm run build:shared` before the test.

```bash
npm run test:api -- tags.service -t "<exact it title>"   # this cycle's test
npm run test:api -- tags.service                         # earlier tests still green?
```

Stop as soon as this test passes. Do not add handling for cases nothing asserts yet; write the test for them in their own cycle.

If a test cannot pass without changing it, that is a signal, not a chore:

- the spec is ambiguous or wrong: ask the user and quote the failing assertion;
- the test asserts an implementation detail: propose the behavioural assertion instead.

Never silently relax an assertion.

## 4. REFACTOR, then start the next cycle

Only with the test green. Improve names, remove duplication, then re-run the whole file. No behaviour change, so every test must stay green without edits. Then go back to step 2 with the next `it`.

## 5. VERIFY before declaring done

```bash
npm run test:api -- <name>   # the target suite
npm run test:api             # every API suite, for regressions
npm run build:api            # tsc type-check of the API
```

Add `npm run build:shared` first if contracts changed, and `npm run test:ui:unit` or the relevant Playwright spec if UI code changed. There is no lint script; run `npx prettier --write <file>` on each file you edited.

Report faithfully: what passed, with which command, what you skipped, what you could not run.

## Behaviour, not implementation

A test that breaks during a refactor when behaviour did not change is a liability.

- Name tests as specifications: `throws 404 when the tag does not belong to the user`, not `calls findOneForUser`.
- Assert the outcome (return value, `AppError`), and assert repository calls only where they are the durable side effect (a save with the right fields).
- Cover both sides of every boundary.
- Use fixed dates (`jest.useFakeTimers().setSystemTime(...)`) wherever code reads the clock, never "now".
- Do not call the real Gmail, push, or AI services; mock them at the boundary as the existing tests do.

## Guardrails

- Never edit a test to make it pass. Raise it instead.
- Never write test N+1 while test N is red, and never write several `it`s to save a round trip.
- Never mark a step done on "it should work now". Quote the actual run output.
- Never retry an identical failed action; state the suspected cause first.
- After 2 or 3 failed attempts at the same step, stop and ask the user.
- Do not implement beyond the current failing test.
