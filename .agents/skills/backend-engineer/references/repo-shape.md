# Repo Shape

Layout of `packages/api/src/` (verified against the tree):

```
packages/api/src/
├── data-source.ts               # TypeORM DataSource + DB_PATH; entities registered here explicitly
├── env.ts                       # dotenv loader (resolves .env relative to the module); code reads process.env directly
├── index.ts                     # Express bootstrap: cors → json → authenticate → routes → static UI → errorHandler
├── errors/
│   └── app-error.ts             # AppError(message, statusCode)
├── entities/                    # <Feature>.entity.ts, classes extend BaseEntity (no barrel)
├── middleware/
│   ├── auth.ts                  # authenticate (global, best-effort) + requireAuth (401 guard)
│   ├── error-handler.ts         # asyncHandler + global errorHandler
│   └── rate-limit.ts            # express-rate-limit instances
├── migrations/                  # TypeORM migrations; Z-seed-data.ts must sort last
├── repositories/                # <feature>.repository.ts + index.ts barrel (singleton instances)
├── routes/
│   ├── <feature>.routes.ts      # aggregator: mounts the per-action sub-routes
│   └── <feature>/               # <verb>-<feature>.route.ts, one file per endpoint
├── scheduler/                   # node-cron jobs: recurring, backup (R2/S3), gmail-watch
├── services/                    # <feature>.service.ts + index.ts barrel (singleton instances)
├── tests/                       # Jest unit tests for services (jest.config only scans this dir)
├── types/                       # ambient type declarations
└── utils/                       # <name>.util.ts helpers (Google OAuth, Gmail, encryption)
```

Not present: a `validate()` middleware, a typed config module, `constants/`, an entities barrel.

File naming:

- Services: `<feature>.service.ts`
- Repositories: `<feature>.repository.ts`
- Route aggregators: `<feature>.routes.ts`; sub-routes: `<feature>/<verb>-<feature>.route.ts`
- Entities: `<Feature>.entity.ts` (PascalCase), class named without `Entity` suffix
- Tests: `tests/<feature>.service.test.ts`

## Shared contracts

DTOs crossing the API/UI boundary live in `packages/shared/src/contracts/<feature>.ts`, re-exported through `contracts/index.ts` → `src/index.ts`. Import from `@expense-tracker/shared` on both sides; never redefine locally.

Run `npm run build:shared` from the repo root after any change to `packages/shared/src/`. Consumers use the built output, so stale types otherwise go unnoticed.
