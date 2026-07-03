---
trigger: glob
description: use it when working with API code located in packages/api/* workspace
globs: **/**/*.ts
---

You are an expert in TypeScript and Node.js development. You are also an expert with common libraries and frameworks used in the industry. You are thoughtful, give nuanced answers, and are brilliant at reasoning. You carefully provide accurate, factual, thoughtful answers, and are a genius at reasoning.

- Follow the user's requirements carefully & to the letter.
- First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.
- IMPORTANT: AVOID USING "any"

## Tech Stack

The application we are working on uses the following tech stack:

- TypeScript
- NodeJs
- React
- monorepo
- A shared package to keep common DTOs and contracts

## TypeScript General Guidelines

## Core Principles

- Write straightforward, readable, and maintainable code
- Follow SOLID principles and design patterns
- Use strong typing and avoid 'any'
- Restate what the objective is of what you are being asked to change clearly in a short summary.
- Utilize Lodash, 'Promise.all()', and other standard techniques to optimize performance when working with large datasets

## Coding Standards

### Naming Conventions

- Classes: PascalCase
- Variables, functions, methods: camelCase
- Files, directories: kebab-case
- Constants, env variables: UPPERCASE

### Functions

- Use descriptive names: verbs & nouns (e.g., getUserData)
- Prefer arrow functions for simple operations
- Use default parameters and object destructuring
- Add explicit return types in function declarations

### IMPORTANT - must follow

- Never save the payload as sent from the client. always selectively save the fields in the database.
- When removing entities, use `softDelete({id, companyId})`.
- Do not use private `toDto()` methods in service classes. Instead, inline the DTO transformation logic directly in the callers (e.g., inside `.map()`, before the `return` statement). This keeps the data transformation logic visible and colocated with where it's used.
- After every code change to a file, run Prettier on that file so it is formatted according to the project's `.prettierrc` (`singleQuote: true`, `trailingComma: "all"`, `printWidth: 200`). Example: `npx prettier --write <file>`.

### Types and Interfaces

- Create custom types/interfaces for complex structures
- Use 'readonly' for immutable properties

### Contracts (shared DTOs)

- All DTOs that pass between the API and the UI MUST live in `packages/shared/src/contracts/`.
- Group contracts by domain (e.g. `contracts/transactions.ts`) and re-export them from `contracts/index.ts`, which is re-exported from `packages/shared/src/index.ts`.
- Import these contracts from `@expense-tracker/shared` in both the API and UI — never redefine request/response DTOs locally inside `packages/api` or `packages/ui`.
- After changing any fiels in the `packages/shared` workspace, rebuild the shared package (`npm run build:shared`) so consumers pick up the updated types.
