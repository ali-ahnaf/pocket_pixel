## Core Conventions

1. Prefer the repo's error types: `AppError` for service-layer failures that are intentional.
2. Use the shared response helpers from the `utilService` instance to return responses. Make sure to call them with `return`:
   - `return utilService.replyOk(res, data, message)`
   - `return utilService.replyError(res, message, data?)`
3. Keep imports aligned with existing barrel exports where the package already provides them.
4. Keep Joi validation schemas on the route files; do not put them in external files.
5. Use `logger.info()` or `logger.debug()` sparingly throughout a request's lifecycle so it can easily be traced what happened where.
6. The application uses a route-service-repository pattern.
7. **All routes use POST only.** Never add GET/PUT/PATCH/DELETE handlers.
8. **Service layer exports & imports:** Define each service as a class in `services/<feature>.service.ts` (e.g., `export class SomeService { ... }`). Keep internal helpers as `private` methods; expose the rest as public instance methods. Do not instantiate inside the service file — the barrel owns the singleton.
9. **Service barrel (`services/index.ts`):** Instantiate every service once and export the instance plus the class (mirrors the `repositories/` barrel):

   ```ts
   import { SomeService } from './some.service';

   export const someService = new SomeService();

   export { SomeService };
   ```

   Consume services via the barrel instance: `import { someService } from '../services';` then call `someService.doSomething()`. One service depending on another imports the sibling instance from the barrel (`import { cacheService } from '.';`); this creates a benign circular import that is safe as long as the dependency is only used at runtime inside method bodies, never at module load.
10. **Singletons that are already instances** (e.g., the winston `logger` in `logger.service.ts`) stay as-is — do not wrap a pre-built instance in a class. The barrel re-exports them for consistency.

## Routes

Routes follow the `Request → authenticate → requireAuth (protected only) → validate → handler → service` pipeline.

### Route files

1. One file per endpoint group in `routes/`, named `<feature>.route.ts`. Each file builds its own `express.Router()` and `export default router;`.
2. **POST only.** Every handler is `router.post('/', ...)`. The mount path (e.g. `/api/auth/login`) is decided when the router is wired in `index.ts` — the route file itself only ever knows `'/'`.
3. **Joi schema lives in the route file** and is exported (e.g. `export const loginSchema`). Type the schema against the shared DTO: `Joi.object<LoginRequest>({ ... })`. Apply it with the `validate(schema)` middleware as the first handler arg.
4. Read the body through the shared DTO type (`const { phone, otp } = req.body as LoginRequest;`) and build the response as the shared response DTO (`const response: LoginResponse = ...`).
5. Return via the `utilService` helpers — `utilService.replyOk(res, response)` / `utilService.replyError(res, message)`. Catch intentional service failures (e.g. a failed `verifyOtp`) locally and reply with an error rather than letting them bubble.
6. On protected routes the handler can rely on `req.user` being set (use `req.user!`); `requireAuth` guarantees it.

```ts
const router = Router();

export const loginSchema = Joi.object<LoginRequest>({
  phone: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

router.post('/', validate(loginSchema), async (req, res) => {
  const { phone, otp } = req.body as LoginRequest;
  const result = await authService.login(phone);
  utilService.replyOk(res, { userId: result.userId, token: result.token } satisfies LoginResponse);
});

export default router;
```

### Wiring in `index.ts`

1. `app.use(express.json())` then `app.use(authenticate)` run globally — `authenticate` decodes a `Bearer` token into `req.user` when present but never rejects.
2. Mount each router under its full path with the `/api` prefix, grouped by public vs protected:
   - Public: `app.use('/api/auth/login', loginRoute);`
   - Protected: insert `requireAuth` before the router — `app.use('/api/auth/onboard', requireAuth, onboardRoute);`
3. A trailing error-handling middleware (`(err, _req, res, _next) => ...`) is the last `app.use`. It logs, maps `AppError` to `utilService.replyError(res, err.message, err)`, and falls back to a generic `Internal server error`.

### Auth middleware (`middleware/auth.middleware.ts`)

- `authenticate` — global, best-effort: verifies the JWT and sets `req.user`, silently leaving it unset on a missing/invalid token.
- `requireAuth` — per-route guard: replies `401 Unauthorized` when `req.user` is absent. Add it only to routes that require a logged-in user.

## Env variables

Whenever a new env variable is introduced:

1. Add it to `api/.env.example`.
2. Add a typed field to `api/src/config/conf.ts`.
3. Use `conf.<field>` everywhere — never reference `process.env` directly.

## Repository layer

1. Repository files live in `repositories/`. Naming: `<feature>.repository.ts`.
2. Always create a base method called by other methods to avoid repetition. Example: `getUserBaseQuery()` is called by `getUserWithShifts()` to add extra joins.
