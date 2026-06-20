## Repo Shape

```
packages/api/src/
├── config/
│   ├── conf.ts                  # typed env config — never use process.env directly
│   ├── data-source.ts           # TypeORM DataSource
│   └── redis.ts                 # ioredis client
├── constants/                   # app-wide constants (scopes, enums)
├── entities/                    # TypeORM entities; index.ts is the barrel export
├── middleware/
│   ├── auth.middleware.ts       # authenticate + requireAuth
│   └── validation.middleware.ts # Joi request body validation
├── migrations/                  # TypeORM migrations (auto-discovered)
├── repositories/                # typed repository classes
├── routes/                      # one file per resource, mounted in index.ts
├── services/                    # business logic
├── types/
│   └── express.d.ts             # extends Express.Request with `user?: AuthUser`
└── index.ts                     # Express app bootstrap + route mounting
```

File naming conventions:
- Services: `<feature>.service.ts`
- Repositories: `<feature>.repository.ts`
- Routes: `<feature>.route.ts`
- Middleware: `<feature>.middleware.ts`
- Entities: `<Feature>Entity.ts`

### Shared contracts

Prefer `shared` workspace over local types for anything consumed by both API and app-ui.

- `shared/src/contracts/` — request/response pairs per feature file
- `shared/src/models/` — domain objects returned from the API (subset of entity fields safe to expose to clients)

Always run `npm run build:shared` from repo root after any change to `shared/src/`.