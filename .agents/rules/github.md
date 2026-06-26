---
trigger: model_decision
description: Use this when user asks to create PRs, commits, or issues on github
---

# GitHub conventions

Read and follow this rule whenever the user asks to create commits, issues, or pull requests.

## Commits

- Write clear, imperative commit messages (e.g. `add rate limit middleware`, not `added` / `adds`).
- Keep the subject line concise; use the body to explain the _why_ when the change isn't obvious.
- Group related changes into a single commit; avoid mixing unrelated work.
- Never touch any code that is not part of the task you are working on.

## Issues

- Write issue descriptions so they are **easy to understand and target first-time contributors**. Use emojis on the description but not on the title of the Issues
- Avoid unexplained jargon, internal shorthand, and assumed context. When a domain term is unavoidable, briefly define it.
- Structure each issue so a newcomer can pick it up without prior knowledge of the codebase:
  - **Context / background** — what part of the app this touches and why it matters.
  - **Problem / goal** — what is wrong or what should exist, in plain language.
  - **Suggested approach** — point to the relevant files/folders and outline concrete steps to get started.
  - **Acceptance criteria** — a simple checklist describing what "done" looks like.
- Link to related files using paths so contributors know where to look.
- Prefer small, well-scoped issues over large vague ones.
- If the task is big, divide it into frontend and backend seperate tasks that should be independent and people can work on them independently.
- Label issues as either frontend, backend, unit-tests. do not add any other labels like bugs, enhancement etc.
- Give clear instructions for first time contributors.
- If an issue is big and touches both frontend and backend, split them in 2 seperate issues one for each component.
- If an issue is dependent on another, add a relationship "Mark blocked by" to the issue and link it with the parent issue.

## Pull requests

- Give the PR a descriptive title summarizing the change.
- In the body, explain what changed and why, and reference any related issues (e.g. `Closes #123`).
- Call out anything reviewers should pay special attention to, plus how the change was tested.
