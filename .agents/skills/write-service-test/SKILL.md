---
name: write-service-test
description: Write Jest unit tests for API services following this repo's mock/factory/AppError conventions. Use when adding or extending tests in packages/api/src/tests.
---

# Write a service test

Jest only scans `packages/api/src/tests/` (`jest.config.js`). Only **services** are unit-tested — repositories are mocked, routes/schedulers are not directly tested. Canonical example: `tests/tags.service.test.ts`.

## The pattern

Every suite follows the same five-part shape:

### 1. Mock the services barrel for the logger

```ts
jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
```

Required because services import `logger` from the barrel; without it the real barrel instantiates every service.

### 2. Typed repository mock — `jest.Mocked<Pick<...>>`

```ts
type TagsRepositoryMock = jest.Mocked<Pick<TagsRepository, 'findManyForUser' | 'findOneForUser' | 'createEntity' | 'save' | 'remove'>>;
```

Pick **only** the methods the service under test calls. Import the repository/entity types with `import type`.

### 3. Entity factory with overrides

```ts
const buildTag = (overrides: Partial<Tag> = {}): Tag => ({ id: 'tag-1', userId: 'user-1', name: 'Food', ...overrides }) as Tag;
```

### 4. Fresh mocks + service in `beforeEach`

```ts
beforeEach(() => {
  tags = { findManyForUser: jest.fn() /* ... */ } as unknown as TagsRepositoryMock;
  service = new TagsService(tags as unknown as TagsRepository);
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

Constructor injection is the whole point of the repo's service design — never `jest.mock` the repository module.

### 5. Assertions

- Happy path: assert the repo method was called with the right args and the return value round-trips.
- Expected failures: assert the thrown `AppError` shape:

```ts
await expect(service.update('user-1', 'missing', input)).rejects.toMatchObject({
  message: 'Tag not found',
  statusCode: 404,
});
```

- Time-dependent logic (caches, schedules): `jest.spyOn(Date, 'now').mockImplementation(() => now)` and advance `now` manually — never real timers.

## Coverage expectations

For each public service method: one happy path, one per `AppError` branch, and edge cases (empty list, ownership miss — `findOneForUser` returning `null`). New service behaviour must land with matching tests (`.agents/rules/testing.md`).

## Run

```bash
npm run test:api -- <feature>.service   # single suite, from root
npm run test:api -- --runInBand         # full run as CI does
```
