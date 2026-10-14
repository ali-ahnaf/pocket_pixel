---
description: Implement an approved SPEC.md test-first — reuses the spec's change plan instead of re-searching, then reviews and collects evidence. Leaves changes uncommitted.
argument-hint: "<path to SPEC.md>"
model: sonnet
effort: high
---

# Implement spec

Spec file: `$1`

The spec is the contract. It was interviewed out of the client and approved. You implement it — you do not redesign it, re-analyse it, or improve on it.

## 1. Read the spec before anything else

Read `$1` in full, and the root `CLAUDE.md` for layering and commands. Then check two gates before you touch a file:

- **Open questions for the client** (section 3) — if that section is non-empty, stop. Report which questions are open and that implementation is blocked on them. An unanswered client question is not yours to answer.
- **Change plan** (section 5) — if that section is empty or missing, stop and say the spec is not ready; it needs the `researcher` pass from `/spec` Step 3.

Section 1 (the end result) is what you are building. Re-read it before you declare done — it, not the tests, is what the client will check.

## 2. Do not re-do the research

The change plan already holds the `file:line` list, the callers checked, the workspaces verified clean, and the build order. Work from it.

Grep only to confirm a specific line before you edit it, or when the plan turns out to be wrong. If the plan *is* wrong — a path moved, a caller was missed — say so explicitly in your final report. Do not silently substitute your own plan; a wrong spec is a finding the user needs.

When the plan says to port a feature from the old single-user API, recover it with `git show 3074bc5^:packages/api/src/lib/<path>`. Do not rewrite it from nothing.

## 3. Work on the current branch

Implement on whatever branch is checked out. Do not create, switch, or check out branches, and do not stash, reset, restore, or clean anything. The user owns git state.

The working tree may already hold uncommitted changes the spec did not produce. Leave them alone. Keep a running list of every file you create or modify; step 6 reviews only those files.

## 4. Implement test-first

**REQUIRED SKILL:** `tdd` for every code cycle in `packages/api`. Do not restate or reinvent its rules — follow them. Where it disagrees with the root `CLAUDE.md` about the test harness (Jest projects, `test/unit` with fakes, `test/integration` with supertest and real MySQL), `CLAUDE.md` wins.

`packages/app` and `packages/shared` have no test runner. Their slices are checked with `npm run typecheck` (and `npx expo lint` in `packages/app`), not RED-GREEN.

Slice order comes from the change plan's order. In this repo that is usually: entity and migration → `packages/shared` types → repository → service → route mounted in `src/app.ts` → app `ApiClient` subclass and `contracts.ts` → screen. One slice = one RED-GREEN cycle where a test runner exists.

The spec's Contract section is the assertion target: the literal route path, request and response shape, column, and status codes written there are what the tests assert against. A test that passes while contradicting the Contract is a failing test.

Anything in **Out of scope** stays unbuilt, however tempting it looks once you are in the file.

## 5. Verify

Run the spec's Verification section exactly as written, in the change plan's build order. Things that are easy to miss here:

- The MySQL container must be up (`cd packages/api && docker compose up -d --wait`) before any integration test or `npm run start:api`.
- A new migration has to be applied to the dev database (`npm run migration:run` in `packages/api`) before a manual request against the running API sees it. Integration tests apply migrations to `aharo_test` themselves.
- `packages/shared` has no build step. Ignore the PostToolUse hook's `build:shared` message.
- After changing `packages/app/.env`, restart Metro; `EXPO_PUBLIC_*` values are inlined at bundle time.

Verification must demonstrate section 1's end result — the observable thing an actor sees. A green test suite is necessary and not sufficient. Paste real output; never assert a pass you did not watch.

## 6. Adversarial review — mandatory, not optional

Spawn the `code-reviewer` agent. It is read-only, adversarial, and runs in fresh context — that is the point. You just spent the whole session convincing yourself the code is right; you are the worst available reviewer of it. Never self-review, never skip this because the tests are green, never skip it because the change is small.

Give it every input it asks for, or it reviews blind:

- **Where the change lives** — the file list from step 3, split into modified and new. State plainly that **nothing is committed** and that the branch and working tree may contain unrelated changes, so a branch-wide diff is wrong. Tell it to review only the listed files: `git diff -- <file>` for modified tracked files, and read new files in full. An untracked new file is invisible to every diff command — a reviewer that misses it reviews half the change.
- **Spec path** — `$1`.
- **Requirement source** — say explicitly that there is no requirement-matrix file in this flow: the spec's **Contract** section is the interface contract and its **Verification** section is the acceptance list. Point it at those so it does not report a missing matrix as a gap.
- **Repo conventions** — tell it this is the Aharo monorepo (Express 5 + TypeORM + MySQL in `packages/api`, Expo app in `packages/app`) and that the root `CLAUDE.md` is the source of truth for layering, testing and gates. Gates in its definition that name another system's layout do not apply here.

Tell it what changed and where, but **do not tell it why you think each choice was correct.** Justifications in the brief are how you talk a reviewer out of a finding.

It does not run `npm test` — that is yours. Run the suite yourself and hand it the output.

### Handling findings

Every finding gets one of three outcomes, stated explicitly:

- **Fixed** — then re-run verification from step 5 in full. A fix invalidates the previous run.
- **Disagreed** — goes to the user with your reasoning. Never resolve a disagreement by yourself; "the reviewer misunderstood" is exactly what a wrong implementer also says.
- **Out of scope** — only if the spec's Out of scope section already covers it. Quote the line.

If findings required non-trivial fixes, re-spawn `code-reviewer` on the updated diff. Fixes introduce bugs at roughly the rate the original code did.

## 7. Evidence

For each item in the spec's Verification section, record PASS or FAIL with the real output that proves it: the HTTP response, the DB row (`docker exec aharo_mysql mysql ...`), the test output, a simulator screenshot. A PASS with no output attached is not a PASS. Take this from the final verification run, after the last fix.

## 8. Stop

**Do not commit, do not stage, do not push, do not open a PR.** Leave the changes in the working tree for the user to inspect.

Final report: what was built, the evidence from step 7, review findings and their resolution, and — separately — anywhere the spec was wrong, incomplete, or contradicted the code. That last part is what improves the next spec.

Never edit `$1`. If the spec needs to change, that is a `/spec` turn with the user.
