---
name: write-service-test
description: Write Jest unit tests for API services in packages/api using this repo's injected mock repository, local entity builder, and AppError conventions. Use when adding or extending tests in packages/api/src/tests.
---

# Write a service test

Jest only scans `packages/api/src/tests/` for `*.test.ts` (`packages/api/jest.config.js`, ts-jest, node environment, `clearMocks: true`). Tests are named `<feature>.service.test.ts`. Services are the main unit under test, with repositories mocked. Routes are not tested. A few non-service units (`gmail-watch-scheduler.test.ts`, `gmail-webhook.util.test.ts`, `util.service.test.ts`) also live here.

Canonical example: `packages/api/src/tests/tags.service.test.ts`. Also see `auth.service.test.ts` and `debts.service.test.ts`.

## The pattern

### 1. Stub the services barrel

Services import `logger` (and sometimes other services) from the `../services` barrel, which otherwise instantiates every service and repository. Stub it before the service is used:

```ts
jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
```

Add only what the service under test actually imports from the barrel. For example `recurring.service.test.ts` adds `tagsService: { ensureUserTagsExist: jest.fn() }`, and `backup.service.test.ts` also stubs `debug` and the other services. Suites for code that does not import the barrel (`util.service.test.ts`, `gmail-webhook.util.test.ts`) need no stub.

### 2. Typed repository mock

```ts
type TagsRepositoryMock = jest.Mocked<Pick<TagsRepository, 'findManyForUser' | 'findOneForUser' | 'createEntity' | 'save' | 'remove'>>;
```

Pick only the methods the service calls. Import repository, entity and shared DTO types with `import type`. Entities are in `../entities/<Name>.entity`, repositories in `../repositories/<name>.repository`, DTOs from `@expense-tracker/shared`.

### 3. Local entity builder

There is no shared factory module. Each test file defines its own builder near the top, with defaults and `overrides`:

```ts
const buildTag = (overrides: Partial<Tag> = {}): Tag => ({ id: 'tag-1', userId: 'user-1', name: 'Food', ...overrides }) as Tag;
```

### 4. Fresh mocks and service in `beforeEach`

```ts
beforeEach(() => {
  tags = { findManyForUser: jest.fn() /* ... */ } as unknown as TagsRepositoryMock;
  service = new TagsService(tags as unknown as TagsRepository);
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

Services take repositories through the constructor, so inject the mock. Do not `jest.mock` a repository module. `createEntity` mocks usually return their input (`jest.fn((data) => data as Tag)`) so you can assert on what gets saved.

Use `jest.mock` for other collaborators only when the service reaches them as module imports: `../data-source` (`backup.service.test.ts`), `../scheduler/recurring-scheduler` (`recurring.service.test.ts`), `web-push` (`push.service.test.ts`). Services injected through the constructor are passed as mocks instead (`gmail.service.test.ts`).

`restoreAllMocks` in `afterEach` is needed when the suite uses `jest.spyOn`; some suites omit it.

### 5. Assertions

- Happy path: assert the repository method was called with the right arguments and the returned value.
- Expected failures: `AppError` (`packages/api/src/errors/app-error.ts`) carries `message`, `statusCode` and optional `code`. Assert them with:

```ts
await expect(service.update('user-1', 'missing', input)).rejects.toMatchObject({
  message: 'Tag not found',
  statusCode: 404,
});
```

- Time-dependent logic (the tags cache in `tags.service.test.ts`): `jest.spyOn(Date, 'now').mockImplementation(() => now)` and advance `now` manually. Do not use real timers.
- Soft delete: check which repository method the service calls (for example tags currently use `remove`, other resources use `softDelete`) and assert that one, scoped to the `userId`.

## Coverage expectations

For each public service method: one happy path, one per `AppError` branch, and edge cases such as an empty list or an ownership miss (`findOneForUser` returning `null`). New service behaviour must land with matching tests (`.agents/rules/testing.md`). Do not loosen an existing assertion to make a test pass unless the behaviour change is intended.

## Run

From the repo root:

```bash
npm run test:api -- <feature>.service   # single suite
npm run test:api -- --runInBand         # full run as CI does
```

After editing a test file, run `npx prettier --write <file>` (project rule: `singleQuote`, `trailingComma: all`, `printWidth: 200`).

## Long-term note

Assumption: the planned offline-first Expo app (`packages/app`, local SQLite, no API server) will reuse these services. If so, tests with injected mock repositories are the pattern worth keeping, because they do not depend on Express or TypeORM.
