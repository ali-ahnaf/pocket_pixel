# Core Conventions

Verified against the actual tree (`packages/api/src`). When this doc and the code disagree, trust the code and fix this doc.

1. Layering is **route → service → repository → entity**. Routes never touch repositories; services never write HTTP responses.
2. Throw `AppError(message, statusCode)` (from `errors/app-error.ts`) in services for expected failures. Never try/catch in routes — wrap handlers in `asyncHandler` so thrown errors reach the global `errorHandler` (mounted last in `index.ts`).
3. Reply only through the `utilService` helpers, always with `return`:
   - `return utilService.replyOk(res, data)` — 200, sends the payload **raw** (no envelope)
   - `return utilService.replyCreated(res, data)` — 201
   - `return utilService.replyNoContent(res)` — 204
   - `return utilService.replyError(res, message, status?)` — defaults to 400; errors are `{ message }`
4. Use `logger.info()` / `logger.debug()` sparingly at meaningful points (mutations, job runs) so a request can be traced.

## Routes

Routes use **RESTful verbs** — GET/POST/PUT/DELETE are all in use (43 route files). One file per endpoint.

1. Each resource has an aggregator `routes/<feature>.routes.ts` that mounts one sub-route per action from `routes/<feature>/<verb>-<feature>.route.ts` (e.g. `routes/tags/post-tag.route.ts`).
2. Both the aggregator and every sub-route build `Router({ mergeParams: true })` — required because routers are nested under `/api/users/:userId/...`.
3. **Joi schema lives in the route file** and is typed against the shared DTO: `Joi.object<CreateTagInput>({ ... })`. There is **no** `validate()` middleware — validate inline at the top of the handler:

```ts
const router = Router({ mergeParams: true });

const createTagSchema = Joi.object<CreateTagInput>({
  name: Joi.string().max(100).required(),
  icon: Joi.string().max(100).optional(),
  backgroundColor: Joi.string().max(50).optional(),
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createTagSchema.validate(req.body);
    if (error) return utilService.replyError(res, error.message);

    const saved = await tagsService.create(req.user!.userId, value as CreateTagInput);
    return utilService.replyCreated(res, saved);
  }),
);

export default router;
```

4. On protected routes the handler can rely on `req.user!` — `requireAuth` guarantees it. Use `req.user!.userId`, never a path param, for the acting user's identity.
5. Do **not** catch service errors in the route — let `AppError` bubble to the global handler.

### Wiring in `index.ts`

1. Global order: `cors` → `express.json()` → `authenticate` (best-effort JWT decode, never rejects).
2. Mount each aggregator router with `requireAuth` under the user-scoped path:
   - Public: `app.use('/api/auth', authRouter);`
   - Protected: `app.use('/api/users/:userId/tags', requireAuth, tagsRouter);`
3. `app.use(errorHandler)` is the **last** middleware. It maps `AppError` → its status code and anything else → 500 `Internal server error`.

## Services

1. One class per file: `services/<feature>.service.ts`. Business logic and `AppError` throwing live here.
2. Repositories are **constructor-injected** and default to the shared singleton, so services are unit-testable with mocks:

```ts
export class TagsService {
  constructor(private readonly tags: TagsRepository = tagsRepository) {}
}
```

3. **Service barrel (`services/index.ts`)**: instantiate every service once, export the instance plus the class. Consume via the barrel: `import { tagsService, utilService } from '../services';`. A service depending on a sibling imports the instance from the barrel (`import { logger } from '.';`) — a benign circular import as long as it's only used inside method bodies.
4. Pre-built singletons (none currently — `Logger` is a class like the rest) follow the same barrel pattern.

## Repositories

1. `repositories/<feature>.repository.ts`, one class per entity. Barrel (`repositories/index.ts`) instantiates and re-exports, mirroring services.
2. The TypeORM repository is resolved **lazily per call** via a private getter, and the DataSource is injectable for tests:

```ts
export class TagsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Tag> {
    return this.dataSource.getRepository(Tag);
  }

  findManyForUser(userId: string): Promise<Tag[]> {
    return this.repo.find({ where: { userId }, order: { name: 'ASC' } });
  }
}
```

3. Common method names: `findManyForUser(userId)`, `findOneForUser(userId, id)`, `createEntity(data)`, `save(entity)`. Deletion: transactions/debts/recurring use `softDelete`; follow the pattern of the repository you're editing.

## Env variables

1. `src/env.ts` loads `.env` relative to the module (package root in dev, `dist/..` in prod). There is no typed config object — code reads `process.env.X` directly.
2. When introducing a new env var: add it to `packages/api/.env.example`, read it near the top of the consuming module, and add it to the `API_ENV` GitHub secret before the next deploy.
