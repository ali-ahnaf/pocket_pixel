# Deploy runbook

How the production deploy to the Hostinger VPS works — required secrets, bundle contract, PM2, migrations, and what breaks it.

Deploy is fully automated on **push to `main`** via `.github/workflows/ci-cd.yml` (jobs: test → build → deploy → release). No manual deploy path exists.

## Required GitHub secrets

| Secret                  | Meaning                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `HOSTINGER_VPS_HOST`    | VPS IP/hostname                                                                                        |
| `HOSTINGER_VPS_PORT`    | SSH port (defaults to 22 if unset)                                                                     |
| `HOSTINGER_VPS_USER`    | SSH user                                                                                               |
| `HOSTINGER_VPS_APP_DIR` | App dir on VPS, e.g. `/var/www/pocket_pixel`                                                           |
| `HOSTINGER_VPS_SSH_KEY` | Private SSH key (deploy job strips `\r`)                                                               |
| `API_ENV`               | **Entire content** of the API `.env` — written verbatim to `packages/api/.env` on the VPS every deploy |

Adding a new env var to the API means updating the `API_ENV` secret too, or prod silently runs without it.

Notably, `API_ENV` must include `OAUTH_CREDENTIALS_ENCRYPTION_KEY` — a 32-byte, base64-encoded key used to AES-256-GCM encrypt per-user Google OAuth client id/secret at rest (`packages/api/src/utils/oauth-credentials-encryption.util.ts`). That util validates the key eagerly as soon as it's imported and throws if it's missing or the wrong length, so once a consumer (service/route) imports it, a deploy without this var in `API_ENV` will fail to boot.

`API_ENV` must also include `APP_BASE_URL` — the API's public origin. The fixed Google OAuth redirect URI is derived from it as `${APP_BASE_URL}/api/oauth/google/callback` (`packages/api/src/utils/google-oauth.util.ts`); every user registers that exact URI in their own Google OAuth client, so it must match production. `WEB_BASE_URL` (where the browser lands after the callback) is optional and defaults to `APP_BASE_URL` since the API also serves the UI in production.

For the Gmail push pipeline, `API_ENV` must include `GMAIL_PUBSUB_TOPIC` (the full app-owned Pub/Sub topic name, e.g. `projects/<proj>/topics/pp-gmail-incoming`) and `GMAIL_PUBSUB_AUDIENCE` (the OIDC audience the push subscription is configured with). Starting/renewing a watch throws without the topic, and the webhook (`packages/api/src/routes/oauth/gmail-webhook.route.ts`) rejects every request without the audience, so a deploy missing either silently stops importing bank alerts. The push subscription's endpoint must be `${APP_BASE_URL}/api/oauth/gmail/webhook` with OIDC auth.

## Bundle contract (the fragile part)

The build job hand-assembles `bundle/` with **hardcoded paths**:

```
bundle/
├── package.json, package-lock.json, ecosystem.config.js
├── packages/shared/{package.json, dist/}
├── packages/api/{package.json, dist/}
└── packages/ui/{package.json, out/}
```

Anything the API needs at runtime that is not inside those paths **does not ship**. Breaks to watch for:

- Renaming/moving a package or changing its build output dir (`dist/`, `out/`) without updating the `Stage deploy bundle` step.
- Runtime assets outside `dist/` (templates, static files) — they silently vanish in prod.
- The workflow itself ignores `**.yml`/`**.yaml`/`**.md` pushes — editing only the workflow file does not trigger a run.

## What happens on the VPS

1. rsync `bundle/` → `$VPS_APP_DIR` with `--delete` (excludes `node_modules/`, `.env*`, `*.sqlite` — DB and env survive).
2. Write `packages/api/.env` from `API_ENV`.
3. `npm ci --omit=dev --workspace=packages/api --workspace=packages/shared --include-workspace-root`.
4. `npm run migration:run-prod` — applies `dist/migrations/*.js` to `/var/www/pocket_pixel/pocket_pixel.sqlite` (path hardcoded in `data-source.ts` `DB_PATH`).
5. `pm2 startOrRestart ecosystem.config.js --only pocket-pixel --env production` + `pm2 save`. Single fork, port 4000; the API serves the UI static export from `packages/ui/out`.
6. Release job tags `v<date>-<run#>` with generated notes.

## Debugging a bad deploy

- SSH in, then: `pm2 logs pocket-pixel`, `pm2 status`, check `$VPS_APP_DIR/packages/api/.env` exists and is current.
- Migration failure: run `npm run migration:run-prod --workspace=packages/api` manually in `$VPS_APP_DIR` to see the error.
- DB lives **outside** the rsync'd tree contract (`*.sqlite` excluded) — never rsync or delete it. The backup scheduler (`backup-scheduler.ts`) pushes copies to R2/S3.
