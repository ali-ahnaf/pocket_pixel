# Loop engineering

Read and follow this rule for any multi-step task (a feature, a refactor, a bug hunt spanning more than one file). It exists so agents plan before acting, stay on track across iterations, and stop when the goal is met — instead of drifting, repeating failed attempts, or burning context re-deriving state.

Based on the agentic-loop model (Goal → Action → Observation → Adjustment): every work cycle should know its goal, take one deliberate action, observe the real result, and adjust before the next cycle.

## 1. Goal — define it before touching code

- **Restate the objective first.** Before the first edit, write a short summary of what "done" means, in verifiable terms. Vague goals ("make it better") are not actionable; a good goal has a termination condition ("stop when `npm run test:api` passes and the new endpoint returns the shared DTO shape").
- **Break the goal into testable subtasks.** Each subtask should be small enough that you can tell, objectively, whether it is finished. Use the task/todo tracker so progress is visible and nothing silently drops.
- **Evaluate the goal at every iteration.** Before each new action, re-check: does this step still serve the stated goal? If you notice scope creep ("while I'm here I could also..."), stop — that is a new task, not this one.
- **Know your stopping criteria.** A loop without a termination condition wastes tokens and invites drift. When the acceptance criteria are met, stop and report; do not keep polishing.

## 2. Plan — write it down, don't hold it in your head

- **Plan before acting.** For any task touching 3+ files, produce an explicit step-by-step plan (pseudocode or a numbered list) before editing. List the files you expect to touch and the order (e.g. shared contracts → entity → migration → repository → service → route → UI client → tests, per the existing architecture rules).
- **Identify verification per step.** Every plan step should name how it will be checked: which test suite, which command, which manual observation.
- **Surface unknowns early.** If a step depends on something unverified (a library API, an existing function's behaviour), read the code first — do not plan on assumptions.

## 3. Spine — keep persistent state so you never lose track

- **Maintain a working state.** For long tasks, keep a running record of: subtasks done, subtasks remaining, decisions made (and why), and dead ends already tried. Use the todo tracker for progress; for complex investigations, write notes to a scratch file.
- **Never repeat a failed attempt unchanged.** If an approach failed, record _why_ it failed before trying the next one. Re-running the same action expecting a different result is the classic broken-loop failure mode.
- **Record intent, not just changes.** When a decision has a non-obvious rationale (a workaround, a deliberately skipped optimization), note it — in the commit body, a code-level constraint comment, or the task notes. Unrecorded intent becomes intent debt: future agents optimize for the wrong thing.
- **On resume or context compression, re-anchor from the spine.** After a break, summary, or long tool sequence, re-read the plan and todo state before acting — do not reconstruct the task from memory.

## 4. Action — one deliberate step per cycle

- **One coherent change per iteration.** Make a change, then verify it, before stacking the next change on top. Batching many unverified edits makes failures impossible to attribute.
- **Stay inside the plan.** If reality contradicts the plan (a file doesn't exist, an API differs), update the plan explicitly first, then act. Never improvise a divergent path while the written plan says otherwise.
- **Never touch code outside the task.** Drive-by refactors and unrelated cleanups are drift.

## 5. Observation — verify with real feedback, not assumption

- **Every action gets observed.** After an edit, run the relevant check: `npm run test:api` (or a scoped `npm run test:api -- <name>`), `npm run test:ui:e2e -- <spec>`, `npm run build:shared` after shared changes, a migration run after entity changes.
- **Read the actual output.** "It should work now" is not an observation. Quote or check the real result — test output, HTTP response, compiler error — before marking a step done.
- **Failed observation → adjust, don't push through.** A failing test after your change means the loop goes back to Adjustment, not forward to the next subtask.

## 6. Adjustment — course-correct before the next cycle

- **Diagnose before retrying.** When something fails, state the suspected cause, then act on that cause. Track how many attempts a step has taken; after 2–3 failed attempts at the same step, stop and reassess the approach (or flag for the human) instead of iterating harder.
- **Update the plan and spine.** Adjustments change the plan; write the change down so later iterations (or other agents) inherit it.

## 7. Verification and the human in the loop

- **Maker/checker: don't only self-review.** For substantial changes, verify with something other than the code's author's own reasoning: run the test suite, use a review pass/subagent, or diff-review the change as a whole before declaring done. If subagents are used, keep roles separate (explore vs. implement vs. verify).
- **Keep the human's oversight cheap.** Report faithfully: what changed, what was verified (with which commands), what was skipped, what remains. Passing tests are necessary, not sufficient — the human is responsible for shipped code, so make the change easy to comprehend. Unexplained generated code is comprehension debt.
- **Stop at genuine decision points.** Destructive actions, scope changes, and ambiguous requirements go to the human. Everything reversible and in-scope proceeds without asking.

## Anti-patterns (never do these)

- Starting to edit before stating the goal and plan.
- Marking a subtask complete without an observed, real verification result.
- Retrying an identical failed action without a new hypothesis.
- Letting scope grow mid-loop without updating the plan.
- Losing the task thread after a long tool sequence instead of re-reading the todo/plan state.
- Declaring "done" while tests are failing, skipped, or unrun.
