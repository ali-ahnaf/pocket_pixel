---
name: spec
description: Interview the user into a self-contained SPEC.md before any code is written. Use when the user types /spec with a feature or change request, to settle decisions and plan the change across api, ui and shared first.
argument-hint: "One line: the feature or change being requested"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, AskUserQuestion, Skill, Agent, Write(SPEC.md), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(rg:*), Bash(ls:*), Bash(cat:*), Bash(sed -n:*)
---

Turn a vague request into a spec that a fresh agent could implement without asking a single question. The spec is later implemented with `/implement-spec`, which reads sections 1, 3 and 5 by number, so keep the section order in Step 5.

## Repo facts the spec must respect

- Workspaces that exist today: `packages/api` (Express 4, TypeORM, SQLite via better-sqlite3), `packages/ui` (Next.js 14, Tailwind), `packages/shared` (DTOs in `src/contracts/`, has a build step: `npm run build:shared`).
- `packages/app` (offline-first React Native with Expo, local on-device SQLite, no API server) is the planned destination. It does not exist yet. Name it only as the planned workspace, never as a place to edit now.
- Source of truth for conventions: root `CLAUDE.md` and `.agents/rules/*.md`. Where they disagree with the code, the code wins and the disagreement goes in the spec.

## Hub and spokes

You are the hub. Run this in the main thread, because only the main thread can call `AskUserQuestion`.

- The hub owns the task, the decomposition, the interview, every decision, and SPEC.md.
- Spokes are subagents. Each one answers the questions the hub assigned to it and returns a report. A spoke never talks to the user and never talks to another spoke.
- Everything flows through the hub. If one spoke needs another spoke's output, the hub runs the first, then pastes its result into the second spoke's brief.
- Spokes start with no context. They never see this conversation, only the brief.

Spokes:

| Spoke | Owns | Spawn when | Step |
|---|---|---|---|
| `Explore` or `cavecrew-investigator` | Repo facts: does X exist, where does Y live | A candidate question might be answered by the filesystem and checking needs more than three files | 2 |
| `web-search` | External facts: provider docs (Google OAuth, Gmail API, Pub/Sub, Web Push), pricing, rate limits, library support for the versions this repo pins | The answer to a candidate question, or a contract field, depends on something outside the repo | 2 or 4 |
| `researcher` | The change plan: `file:line` edits, callers, blast radius, build order | Always, once, after the interview | 4 |

Spawn a spoke only for a question listed against it in the decomposition. A spoke with no question assigned does not run.

## The Iron Law

No code, no file edits, no branch until SPEC.md exists and the user has approved it.

`allowed-tools` enforces this: read, search, ask, delegate. The only writable path is `SPEC.md`. The hub has no web tools, so external facts must come from the `web-search` spoke.

Ambiguity should surface now, while changing direction is cheap. Once 400 lines exist it is not.

| Excuse | Reality |
|---|---|
| "Requirement is clear enough" | Then the interview asks little or nothing. Still write the spec. |
| "I'll spec it as I build" | Then the ambiguity ends up in the code. |
| "Small change, skip the spec" | Small changes don't get `/spec` typed at them. The user already judged the size. |
| "I'll write the spec after, from the diff" | That is a changelog, not a spec. |
| "I'll ask the questions while editing files" | Interview first, edits after. No overlap. |
| "I'll spawn every spoke to be safe" | A spoke with no assigned question returns noise the hub then has to read. |

## Step 1: Intake and decompose

Read only far enough to decompose. Three things:

- Does this already exist, in whole or in part?
- Which workspaces are in play (`packages/api`, `packages/ui`, `packages/shared`)?
- Does it depend on the API server? Auth (JWT, `requireAuth`), Gmail import (OAuth, Pub/Sub webhook, vault watchers), cron jobs in `packages/api/src/scheduler/`, Web Push, S3 backup, stored AI credentials. If yes, flag it. Step 3 covers what to do about it.

Then write the decomposition in your reply (not in SPEC.md). List every unknown, one line each, with exactly one owner:

- `user`: passes all three checks in Step 3.
- `repo`: a fact the filesystem answers. Answer it yourself if it takes three files or fewer, otherwise assign it to `Explore`.
- `web`: an external fact. Assign it to `web-search`.
- `plan`: where and how the code changes. Assign it to `researcher`, which runs in Step 4.
- `hub`: anything else. Decide it and record it as `(assumed)`. A claim about how the existing code behaves ("only X writes Y", "the UI already handles 401") is never `hub`: it is a `repo` fact, and if you cannot check it in three files, `researcher` confirms it in Step 4.

Do not map callers or line numbers here. That is `researcher`'s job in Step 4, and doing it now maps a design the user has not agreed to yet.

## Step 2: Fact spokes (only if Step 1 assigned `repo` or `web` unknowns)

Facts are never the user's job. Spawn every `Explore` and `web-search` spoke from Step 1 in one message so they run in parallel. Wait for all of them before the interview, so the questions use the facts.

A fact that settles a `user` unknown turns it into a `hub` decision. Drop that question.

## Step 3: Interview (hub only, short)

Ask the fewest questions that change the spec. Decide everything else yourself and record it as an assumption. The user overturns assumptions when reviewing the spec, and reading a list is faster than answering questions.

Before you ask a question, check that all three hold:

- The answer changes the end result the user sees, the contract, or data you cannot un-write.
- The repo, CLAUDE.md, an existing pattern, or a spoke report cannot answer it.
- There is no sensible default. You would build it differently depending on the answer.

Anything that fails a check is yours to decide: error copy, loading and empty states, naming, conventional edge cases. Mark those decisions `(assumed)` in the spec.

Walk every axis yourself, but most land as assumptions, not questions:

- Technical: entity and migration, repository, service, route, shared DTO, UI api client, config and the `API_ENV` secret (see `documentation/deployment.md`).
- UI/UX: screens and states, copy.
- Edge cases: duplicates, retries, partial failure, rows that predate the change (soft-deleted rows included).
- Concerns: production breakage, blast radius, irreversible data, privacy (bank and email content), cost.
- Offline: the long-term plan is an offline-first app with no server. If Step 1 flagged an API dependency, say what it implies once the API is gone: who authenticates, where the data lives (on-device SQLite), what replaces a server-side job (a cron or webhook cannot run on a phone while the app is closed), and whether a third-party integration (Gmail OAuth and push notifications) can work without a backend at all. Record each as an `(assumed)` decision under an "Offline assumptions" group. They are guesses about a workspace that does not exist yet. Ask the user only if the feature's design would differ now depending on the answer (for example, a data shape that would be costly to migrate to local SQLite).

Budget: one `AskUserQuestion` call with up to four questions. If you have more than four candidates, keep the four that cost most if guessed wrong and turn the rest into assumptions. Make a second call only if an answer (usually "Other") or a spoke report opened a new decision that passes all three checks. Never make a third. If nothing passes the checks, ask nothing and say so.

Question format:

- Every question goes through `AskUserQuestion`, never in prose.
- Your recommended answer is the first option, labelled `(Recommended)`. Each option's `description` gives the tradeoff.
- Options are real, mutually exclusive answers. Never `Yes` / `No` / `Not sure`.
- `multiSelect: true` when answers stack. `preview` when the decision is a shape: a request body, a column definition, a screen layout.

## Step 4: Map the change

Decisions are settled. Spawn `researcher` once. If a contract field depends on an external API whose exact shape the Step 2 reports did not confirm, spawn `web-search` in the same message.

You do not map the change yourself. `researcher` runs read-only and returns an ordered `file:line` change plan, the callers it checked, the workspaces it verified clean, and the build order. Its report becomes section 5 of the spec verbatim, and its build order feeds section 8.

Give `researcher` the draft Goal (section 1), not only the Decisions and Contract. Every observable claim in the Goal must come back in its Goal trace as either a plan item or existing code at `file:line`. A claim the Contract never mentions, like "an expired session is sent to the login page", is where plans silently fall short: the API half gets planned and the UI half is assumed to exist.

When the report comes back, before you write the spec:

- A Goal claim traced as `MISSING`: add it to the plan (re-spawn `researcher` with it as a question), or cut the sentence from the Goal and move it to Out of scope. Never leave a Goal sentence the plan does not build.
- An assumption marked `refuted`: rewrite or drop it. If the corrected fact changes the end result, it goes through the three checks in Step 3.

If any spoke comes back naming an unsettled decision, run it through the three checks from Step 3. If it fails any of them, decide it and mark it `(assumed)`. If it passes all three, ask it with `AskUserQuestion` (this counts as your second call) and re-spawn only that spoke with the answer.

## Spoke brief

Every brief has these parts, in this order:

1. Role line: "You are a spoke for a spec hub. Your report goes to the hub, not to a user."
2. Questions: the unknowns from the decomposition assigned to this spoke, numbered.
3. Settled so far: decisions and spoke facts that bear on these questions. For `researcher`, this is the draft Goal, the full Decisions list and the Contract, not the original request. Mark which assumptions claim existing behavior, so it checks them.
4. Scope: the workspaces or paths to search, or for `web-search`, the versions that matter.
5. Return shape. For `researcher`, its own report format. For every other spoke, per question: the answer, the evidence (`file:line`, or URL plus publication or retrieval date), and `confirmed` or `inferred`.
6. Closing line: "If a question cannot be answered without a decision only the user can make, return that decision as a question with options. Do not pick one."

Part 4 matters because the `researcher` and `web-search` definitions were written for another project and still name its layout. Put this correction in the brief so they search this repo:

- For `researcher`: "This is the expense_tracker repo. Plan only in `packages/api`, `packages/ui` and `packages/shared`. `packages/app` does not exist yet. Ignore parts of your definition that name MySQL, `conf.ts`, `HttpError`, `test/unit/fakes.ts`, `.claude/skills/react-native`, calorie targets, `3074bc5`, `npm run typecheck`, or `test:api:unit`. Here: SQLite via TypeORM (`packages/api/src/data-source.ts`, entities in `src/entities/`, migrations in `src/migrations/`, config in `src/env.ts`), routes under `src/routes/<feature>/` mounted by `src/routes/<feature>.routes.ts`, errors via `AppError` and the global `errorHandler`, services and repositories exported from `services/index.ts` and `repositories/index.ts`, API tests in `packages/api/src/tests/*.test.ts` (Jest), UI api clients in `packages/ui/src/lib/api`, UI tests in `packages/ui/src/__tests__` (Vitest) and `packages/ui/e2e` (Playwright). Commands are the root scripts in `package.json`. `packages/shared` has a build step (`npm run build:shared`)."
- For `web-search`: "Pinned versions are in each `packages/*/package.json` (for example Express 4, Next.js 14, TypeORM 0.3, better-sqlite3 12, node-cron 4). `packages/app/app.json` does not exist. If a question concerns Expo or React Native, say that no version is pinned yet and answer for the current stable SDK, marked `inferred`."
- If the feature is flagged offline-sensitive in Step 1, also ask `researcher` to list which files carry server-only logic (for example schedulers, OAuth, webhook handlers) that a no-server app would need to replace. This is a list for the spec's Risks, not work to plan.

## Step 5: Write SPEC.md

Write `SPEC.md` at repo root. It must be readable standalone: assume the implementer has this conversation nowhere in context. Cite every external fact from `web-search` with its URL and date where the spec uses it. Sections, in this order:

1. Goal, the end result: what the user sees once this is built, written as if it already works. Concrete and observable, not intent: the screen they land on and what is on it, the request they send and the response they get back, the transaction that now appears in the list, the chart whose numbers changed. Name the actor and walk their path start to finish. Include what they see when it goes wrong, if the interview settled that.

   Write it so the user can read this one section and say "no, that's not what I asked for". That check is the point. No implementation nouns here: no table names, no route paths, no repository methods. Those belong in sections 4 and 5.

   Then one line: why the requester wants it.
2. Decisions: every settled answer, one line each, tagged `(asked)` or `(assumed)`. Group the assumed ones so the user can scan and overturn them. Keep offline assumptions in their own group, each marked as an assumption about the planned `packages/app`.
3. Open questions: anything the user could not settle. Empty is fine; a fake answer is not.
4. Contract: the interfaces a caller or the UI can react to, written out literally: route path and method, request and response shape (the shared DTO name from `packages/shared/src/contracts/`), table column and type, env key, changed function signature. These are decisions, not search results. Each one traces to an answer in section 2. Not the file list.
5. Change plan: `researcher`'s report from Step 4, pasted: the ordered `file:line` plan, callers and blast radius, workspaces checked and clean, and what it rejected as too much. Do not summarise it; the implementer needs the paths. If Step 4 has not run, this section is not writable yet.
6. Out of scope: what this explicitly does not do. Name the tempting adjacent things by name so nobody quietly builds them. Building `packages/app` or porting this feature to it is out of scope unless the user asked for it.
7. Risks: what can break, and the mitigation for each. Include data that cannot be un-written (migrations, hard deletes), the `API_ENV` secret if a new env var is added, and, when Step 1 flagged it, what a no-server app would have to replace.
8. Verification: end to end, runnable by someone who was not in this conversation. The exact commands in `researcher`'s build order, each one cited to a script in a `package.json` or a config file (the root `CLAUDE.md` has been wrong before). Typical ones: `npm run build:shared`, `npm run migration:run`, `npm run test:api -- <name>`, `npm run test:ui:unit`, `npm run test:ui:e2e -- <spec>`. Add the request or UI steps that exercise the flow and the observable result that proves it: a status code, a row, a rendered state. Rows can be checked with the `pocket-pixel-sqlite` MCP server in `.mcp.json` or against `packages/api/pocket_pixel.sqlite`. It must prove section 1's end result, not merely that the code compiles. A test file name alone is not verification. Sample data must pass the validation it hits (the route's Joi schema), and shell commands must match the real config (`packages/api/.env.example`, `ecosystem.config.js`). Anything that touches production (deploys, the live database) is a separate step for the user to confirm, after trying it locally.

## Step 6: Hand back

Show the user the Goal first, then Decisions (assumed ones called out, offline ones grouped), then Open questions, then one line per spoke that ran and the question it answered. Then stop. Goal leads: if the end result is wrong, nothing below it matters. They approve, overturn assumptions, or take the open questions to whoever can answer them. Implementation is a separate turn.

## Red flags: stop and correct course

- You are about to open an editor and SPEC.md does not exist.
- You typed a question in prose instead of calling `AskUserQuestion`.
- You asked something the repo, a spoke, or a sensible default could have answered.
- You are about to make a third `AskUserQuestion` call, or a second one that no earlier answer or spoke report prompted.
- You spawned a spoke that has no question assigned in the decomposition.
- You spawned fact spokes one at a time when they could have gone in one message.
- A spoke brief contains the raw request instead of numbered questions and settled decisions, or omits the repo correction for `researcher` or `web-search`.
- You passed one spoke's output to another without it going through you.
- A spec section says "TBD", "as appropriate", "handle errors gracefully", or "existing pattern".
- Out of scope is empty.
- Verification cannot be run by someone who was not in this conversation.
- The change plan names `packages/app` files as work to do now.
- The feature depends on auth, Gmail import, cron or push and the spec never mentions what that means for the offline app.
- You answered a question yourself that only the user can answer.
- The Goal describes work to be done ("add an endpoint that...") instead of the end result an actor sees.
- You are grepping for callers or line numbers before the interview is done. That is Step 4 work leaking into Step 1.
- You wrote the change plan yourself instead of spawning `researcher`, or summarised its report instead of pasting it.
- A Goal sentence has no entry in `researcher`'s Goal trace, or its entry says `MISSING`.
- An `(assumed)` decision states how existing code behaves and `researcher` did not mark it `confirmed`.
