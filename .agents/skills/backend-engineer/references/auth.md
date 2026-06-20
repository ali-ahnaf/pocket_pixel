## Authentication

### Middleware

Two middlewares live in `api/src/middleware/auth.middleware.ts`:

| Middleware | Behaviour |
| --- | --- |
| `authenticate` | Runs on every request (mounted globally in `index.ts`). Reads `Authorization: Bearer <token>`, verifies the JWT against `conf.jwtSecret`, and sets `req.user: AuthUser` if valid. Always calls `next()` — never blocks. |
| `requireAuth` | Guard middleware. Returns `{ success: false, message: 'Unauthorized' }` if `req.user` is not set; otherwise calls `next()`. |

`AuthUser` is declared globally in `api/src/types/express.d.ts`:

```ts
interface AuthUser {
  id: string;
  companyId: string;
}
```

### Mounting pattern

```ts
// index.ts
app.use(authenticate); // always first — populates req.user on every request

// public routes
app.use('/auth/login', loginRoute);
app.use('/auth/register', registerRoute);

// protected routes — requireAuth blocks if req.user is unset
app.use('/users/profile', requireAuth, profileRoute);
```

### Current endpoints

| Path | Auth required | Route file |
| --- | --- | --- |
| `POST /auth/login` | No | `routes/login.route.ts` |
| `POST /auth/register` | No | `routes/register.route.ts` |
| `POST /users/profile` | Yes | `routes/profile.route.ts` |

### Adding a new protected route

1. Create `api/src/routes/<resource>.route.ts` — export a `Router` with `router.post('/', ...)`.
2. Define a Joi schema at the top of the file and call `validate(schema)` before the handler.
3. In `index.ts`, mount it: `app.use('/resource/action', requireAuth, resourceRoute);`
