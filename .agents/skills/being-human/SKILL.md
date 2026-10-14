---
name: being-human
description: Use when writing or editing any prose that ships with the code - README, documentation/*.md, migration notes, PR and issue descriptions, commit bodies, JSDoc/TSDoc, inline comments. Also use when prose reads as machine-generated, sounds like marketing copy, or a reviewer says the docs are bloated, generic, or get skimmed.
---

# Writing in human tone

## Overview

Prose that reads as machine-generated gets skimmed, and once a reader starts skimming they skim past the one paragraph that mattered. Write as a working engineer explaining something to the colleague who will maintain it next.

The audience is a human. Assume they are competent, busy, and already have the code in front of them.

## The contract

Every piece of prose you write has three parts, in this order:

1. **The point, first sentence.** What this is, what changed, or why the reader is here.
2. **What the reader cannot get from the code.** Constraints, ordering requirements, failure modes, the obvious approach you rejected and why.
3. **Stop.** The last fact is the last sentence. No wrap-up.

If a paragraph does not fit one of the first two parts, cut it.

## Voice

- Present tense, active voice, direct address. "Run `npm run build:shared` first" beats "It is recommended that the shared package be built first".
- Concrete nouns from this codebase: `userId`, `utilService`, `AppError`, `softDelete`, `API_ENV`, not "the relevant identifier" or "the appropriate handler".
- Ordinary words. Use _use_, not _utilize_. Use _so_, not _in order to_. Use _help_, not _facilitate_.
- Vary sentence length. A short one after two long ones lands.
- State opinions flatly when they are true: "Don't edit `Z-seed-data.ts` to rename it. It must sort last in `migrations/`."
- Admitting you don't know is human. "Not sure why Gmail returns an empty history list after reconnect. It does, so we do a full sync."
- Contractions are fine.

## Tells to cut

| Tell                                                                   | Write instead                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| "This document provides a comprehensive overview of..."                | "How invoicing works."                                |
| "It's important to note that X"                                        | X                                                     |
| leverage / utilize / facilitate / robust / seamless / delve / holistic | use / use / help / (name the actual property)         |
| "In today's fast-paced environment..."                                 | Delete the opener, start at the point.                |
| "fast, reliable, and scalable" (the rule of three)                     | One accurate adjective, or none.                      |
| "Whether you're a new dev or a seasoned engineer..."                   | Delete.                                               |
| "not just X, but Y"                                                    | Say Y.                                                |
| Any em dash (this repo bans them)                                      | Full stops, commas, or a colon.                       |
| Bold on half the phrases                                               | At most one bolded phrase per paragraph.              |
| Emoji headings, check/cross decoration, rocket icons                   | Plain headings. Emoji only in issue descriptions.     |
| "In conclusion" / "Overall" / a closing summary paragraph              | End at the last fact.                                 |
| "Feel free to..." / "Happy coding!" / "Let's dive in"                  | Delete.                                               |
| "may potentially sometimes"                                            | Pick one hedge, or state it plainly.                  |
| Every section padded to the same length                                | Uneven sections are fine. Some things need two lines. |

## Structure

- Headings only when the piece runs longer than a screen. Three headings over four paragraphs is worse than no headings.
- Bullets only for genuinely parallel items. Prose that has been shredded into bullets loses its connective tissue, and that tissue is usually the reasoning.
- Don't open a section by restating its heading.
- Don't write a section because the template has one. An empty "Prerequisites" heading is worse than no heading.

## Where it ships

- Docs live in `documentation/` (see `documentation/deployment.md`). Add to an existing file before creating a new one. The README stays an entry point.
- Commits, PRs and issues follow `.agents/rules/github.md`. Commit subjects are imperative and short (`add rate limit middleware`); the body explains why when it isn't obvious. A PR body says what changed, why, what reviewers should look at, and how it was tested. Don't repeat the diff.
- Issue descriptions are the one place that rule asks for emojis, and they target first-time contributors, so define terms and point to file paths. Keep issue titles and everything else emoji-free.

## Comments

Add a comment only when the code can't say it: a constraint, an ordering requirement, a workaround. This skill decides how it reads.

- One line. State the constraint, not the narrative.
- No step narration: `// Step 1: fetch the user` is noise.
- A `TODO` names a person or a condition. `// TODO(ahnaf): drop once the React Native app no longer calls the API` is useful; `// TODO: improve` is not.

```ts
// Reads as generated
/**
 * This function is responsible for retrieving the user data from the database.
 * It takes a userId parameter and returns a Promise that resolves to the user.
 * It's important to note that this function will throw if the user is not found.
 */
async function getUser(userId: string): Promise<User> { ... }

// Reads as written by someone who hit the problem
/** Throws AppError(404) on a missing user. The route relies on the global error handler to reply. */
async function getUser(userId: string): Promise<User> { ... }
```

## Don't overcorrect

Sounding human is not sounding chatty. Slang, jokes, first-person storytelling ("I spent an hour on this one"), and forced casualness are their own kind of noise. Plain and direct is the target.

## Self-check before you save

- Read the first sentence alone. Does it carry the point?
- Delete the last paragraph. Did the piece lose anything?
- Count the adjectives. Can any of them be a number or a fact instead?
- Would you send this to a colleague in a message, or would you trim it first? Trim it first.
