---
trigger: glob
description: use it when working with API code located in packages/api/* workspace or the UI code in packages/ui/*
globs: "**/*.ts, **/*.tsx"
---

# Testing

Read and follow this rule whenever you modify application code.

## Don't break the tests

Production code and its tests are coupled. A change that looks self-contained can
still break behaviour an existing test depends on (a redirect, a thrown error, a
storage write, a route shape, etc.). So:

- **Before editing a file, find the tests that exercise it.** Look for:
  - API: `packages/api/**/*.spec.ts` / `*.test.ts` (Jest).
  - UI: `packages/ui/e2e/**/*.spec.ts` (Playwright e2e) and any component tests.
  - Search for the file/symbol you're touching across the test directories — a test
    may cover it indirectly (e.g. an `ApiClient` change affecting the sign-in flow).
- **After editing, run the affected tests** and confirm they still pass:
  - `npm run test:api` (or `npm run test:api -- <name>` for a single suite).
  - `npm run test:ui:e2e -- <spec-file>` for the relevant e2e spec(s).
- **If a change breaks a test, fix it deliberately:**
  - First decide whether the test caught a real regression. If so, **fix the code**,
    not the test. Don't loosen assertions or delete the test to make it pass.
  - Only change the test when the behaviour it asserts is intentionally changing —
    and update the assertion to match the new, correct behaviour.
- A behaviour change that touches a flow under test (auth, redirects, error
  surfacing, persistence) **must** keep its e2e/unit coverage green before the work
  is considered done.

## When adding behaviour, add/extend coverage

If you add a new branch or side effect to a tested module, add or extend a test
that exercises it, following the existing conventions in the matching test file.
