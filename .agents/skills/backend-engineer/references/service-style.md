# Service Style

Services hold the business logic and repository orchestration:

- Keep routes thin: Joi validation (schema at the top of the route file) and a single service call. No business logic, no try/catch in routes.
- Routes never call repositories directly, always go through a service. Services access data only through repository methods, never `dataSource.getRepository()` inline.
- Repositories are constructor-injected with the barrel singleton as default (`constructor(private readonly tags: TagsRepository = tagsRepository) {}`) so tests can pass mocks.
- Throw `AppError(message, statusCode)` for expected failures (404 not-found, 400 invalid state); let it bubble to the global error handler.
- Use transactions / the DataSource directly only when the flow needs atomic multi-entity updates (see `backup.service.ts`).
- Prefer clear, explicit branching over abstract generic helpers, the repo favors straightforward code.
- No private `toDto()` methods, inline DTO mapping at the call site (inside `.map()`, before `return`).
- Log meaningful mutations with `logger.info('Created tag', { userId, tagId })`-style structured context.
- Never save a client payload as sent. Copy only the fields you intend to persist into the entity.
- Scope every read, update, and delete by `userId`.
- Keep Express types (`Request`, `Response`) out of services. They take plain inputs and return plain data, so they can run without a server.
