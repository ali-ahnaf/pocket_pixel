---
trigger: always_on
---

# GitHub conventions

Read and follow this rule whenever the user asks to create commits, issues, or pull requests.

## Commits

- Write clear, imperative commit messages (e.g. `add rate limit middleware`, not `added` / `adds`).
- Keep the subject line concise; use the body to explain the _why_ when the change isn't obvious.
- Group related changes into a single commit; avoid mixing unrelated work.

## Issues

- Write issue descriptions so they are **easy to understand and target first-time contributors**. Use emojis
- Avoid unexplained jargon, internal shorthand, and assumed context. When a domain term is unavoidable, briefly define it.
- Structure each issue so a newcomer can pick it up without prior knowledge of the codebase:
  - **Context / background** — what part of the app this touches and why it matters.
  - **Problem / goal** — what is wrong or what should exist, in plain language.
  - **Suggested approach** — point to the relevant files/folders and outline concrete steps to get started.
  - **Acceptance criteria** — a simple checklist describing what "done" looks like.
- Link to related files using paths so contributors know where to look.
- Prefer small, well-scoped issues over large vague ones.

## Pull requests

- Give the PR a descriptive title summarizing the change.
- In the body, explain what changed and why, and reference any related issues (e.g. `Closes #123`).
- Call out anything reviewers should pay special attention to, plus how the change was tested.
