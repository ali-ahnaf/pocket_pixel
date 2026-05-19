## Instructions to follow

### API

- do not add any try catch in routes. Any errors thrown should be handled by global error handler middleware.
- whenever a new migration file is created, run `npm run migration:run` to run the migration from the root.

### Github secrets

```bash
# the following are dummy example values
HOSTINGER_VPS_HOST=145.223.71.24
HOSTINGER_VPS_USER=deploy
HOSTINGER_VPS_APP_DIR=/var/www/pocket_pixel
HOSTINGER_VPS_SSH_KEY=<privatesshkey>

```
