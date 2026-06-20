## Service Style

Services in this repo usually hold the real business logic and repository orchestration:

- Keep controllers thin. Controllers should be used to validate requests using Joi. Keep Joi schemas on top of the route files.
- Never use repositories directly from the service or controller layer. Always call the methods from repository layers.
- Use transactions or `DataSource` only when the flow needs atomic updates.

- Prefer clear, explicit branching over abstract generic helpers when the repo already favors straightforward code.
