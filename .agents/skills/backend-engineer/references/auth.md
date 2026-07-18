# Authentication

## Middleware (`middleware/auth.ts`)

| **Middleware** | **Purpose** | **Behavior** |
| :------------- | :---------- | :----------- |
| **`authenticate`** | Parses and validates JWT authentication. | Mounted globally in `index.ts`. Reads the `Authorization: Bearer <token>` header, verifies the JWT, and sets `req.user: TokenPayload` when the token is valid. **Never rejects the request**—if the token is missing or invalid, `req.user` remains `undefined` and the request continues. |
| **`requireAuth`** | Protects routes that require authentication. | Applied per route. Checks whether `req.user` is set. If not, responds with **`401 Unauthorized`** using `utilService.replyError({ message: 'Unauthorized' })`. Otherwise, calls `next()`, allowing downstream handlers to safely access `req.user!`. |

Tokens are JWTs with 30-day expiry, created/verified by `AuthService` (`createToken` / `verifyToken`). Passwords are bcrypt-hashed.

## Mounting pattern (`index.ts`)

```ts
app.use(authenticate); // global, best-effort — populates req.user when possible

// public
app.use('/api/auth', authRouter);

// protected — requireAuth blocks when req.user is unset
app.use('/api/users/:userId/tags', requireAuth, tagsRouter);
```

Every `/api/users/...` mount carries `requireAuth`. Routers under it use `Router({ mergeParams: true })` so `:userId` is visible — but handlers should identify the acting user with `req.user!.userId`, not the path param.

## Adding a new protected resource

1. Create `routes/<feature>/<verb>-<feature>.route.ts` files and an aggregator `routes/<feature>.routes.ts` (see conventions.md for the handler shape).
2. Mount in `index.ts`: `app.use('/api/users/:userId/<feature>', requireAuth, featureRouter);`
3. In handlers, use `req.user!.userId` for ownership scoping in every service call.
