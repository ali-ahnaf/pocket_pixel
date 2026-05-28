---
name: devops
description: Use when the user explicitly asks to push changes to GitHub or deploy the app to the VPS.
---

# DevOps

Use this skill only for explicit push or deployment requests. Do not use it for normal coding, local-only git tasks, or reviews.

## Commit And Push

When asked to push changes to GitHub, use this sequence:

```bash
git add .
git commit -m "<commit message>"
git push
```

## Deploy To VPS

Use this flow when the user asks to deploy `pocket_pixel` to production.

### Current Production Target

- SSH host: `root@69.62.74.1`
- SSH key: `~/.ssh/oumo_ssh`
- Project directory on VPS: `/home/ubuntu/projects/pocket_pixel`
- PM2 app name: `pocket-pixel`

### Important Notes

- Do not use `/var/www/pocket_pixel` for deploys. That path exists on the server, but the real git checkout used for deploys is `/home/ubuntu/projects/pocket_pixel`.
- Run the commands in the exact order the user asked for unless they explicitly want a different flow.
- Stop on the first failure and report the failing step clearly.

### Manual Deploy Sequence

1. SSH into the VPS:

```bash
ssh -i ~/.ssh/oumo_ssh root@69.62.74.1
```

2. Change into the project directory:

```bash
cd /home/ubuntu/projects/pocket_pixel
```

3. Pull the latest GitHub changes:

```bash
git pull --ff-only
```

4. Run migrations:

```bash
npm run migration:run
```

5. Install dependencies:

```bash
npm install
```

6. Build shared package:

```bash
npm run build:shared
```

7. Run the full build:

```bash
npm run build
```

8. Restart the PM2 app:

```bash
pm2 restart pocket-pixel
```

9. Verify the process is back online:

```bash
pm2 show pocket-pixel
```

### One-Shot Remote Command

If the user wants the full deploy run as a single remote command, use:

```bash
ssh -tt -i ~/.ssh/oumo_ssh root@69.62.74.1 '
set -e
cd /home/ubuntu/projects/pocket_pixel
git pull --ff-only
npm run migration:run
npm install
npm run build:shared
npm run build
pm2 restart pocket-pixel
pm2 show pocket-pixel
'
```

### Expected Verification

- `git pull --ff-only` should complete cleanly.
- `npm run migration:run` may apply new migrations; report that clearly.
- `npm run build:shared` and `npm run build` must exit successfully.
- `pm2 show pocket-pixel` should show `status: online`.
