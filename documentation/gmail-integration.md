# GCP Setup

To set up the automatic transaction detection system, the following steps are required:

| Placeholder      | Meaning                                            | Example                                  |
| ---------------- | -------------------------------------------------- | ---------------------------------------- |
| `PROJECT_ID`     | Your GCP project id                                | `pocket-pixel-prod`                      |
| `PROJECT_NUMBER` | The project's numeric id (Console home / `gcloud`) | `123456789012`                           |
| `APP_BASE_URL`   | The API's public origin (already in `API_ENV`)     | `https://DOMAIN`                         |
| `Webhook URL`    | Always `${APP_BASE_URL}/api/oauth/gmail/webhook`   | `https://DOMAIN/api/oauth/gmail/webhook` |

You can do everything in the **Console** or with the **gcloud CLI** — both are shown. `gcloud` is faster; install it and run `gcloud auth login && gcloud config set project PROJECT_ID` first.

## 1. Enable the APIs

Console: enable **Cloud Pub/Sub API** and **Gmail API** for the project.

```bash
gcloud services enable pubsub.googleapis.com gmail.googleapis.com
```

## 2. Create the Pub/Sub topic

Name it `pp-gmail-incoming` (any name works — just keep it consistent). Its full name is `projects/PROJECT_ID/topics/pp-gmail-incoming`; that full name is the `GMAIL_PUBSUB_TOPIC` env var.

```bash
gcloud pubsub topics create pp-gmail-incoming
```

## 3. Let Gmail publish to the topic

Gmail publishes push notifications as a fixed Google-owned service account. Grant it the **Pub/Sub Publisher** role on the topic, or `users.watch` calls fail.

```bash
gcloud pubsub topics add-iam-policy-binding pp-gmail-incoming \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

Console equivalent: open the topic → **Permissions** → Add principal `gmail-api-push@system.gserviceaccount.com` → role **Pub/Sub Publisher**.

## 4. Create a service account for the push (OIDC) token

Each push request carries a Google-signed OIDC token; our webhook verifies its signature, issuer, and **audience** before trusting the body. Create an identity for that token.

```bash
gcloud iam service-accounts create pp-gmail-incoming-invoker \
  --display-name="Gmail push webhook invoker"
```

The SA email is `pp-gmail-incoming-invoker@PROJECT_ID.iam.gserviceaccount.com`.

Then let the Pub/Sub service agent mint tokens as that SA (required for authenticated push):

```bash
gcloud iam service-accounts add-iam-policy-binding \
  pp-gmail-incoming-invoker@PROJECT_ID.iam.gserviceaccount.com \
  --member="serviceAccount:service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

To obtain project number run:

```bash
gcloud projects describe <PROJECT_ID> --format="value(projectNumber)"
```

## 5. Create the push subscription

Point it at the webhook URL, with OIDC auth using the SA from step 4. The **audience** you set here is exactly what the API checks — set it to the webhook URL and use that same value for `GMAIL_PUBSUB_AUDIENCE`.

```bash
gcloud pubsub subscriptions create pp-gmail-incoming-sub \
  --topic=pp-gmail-incoming \
  --push-endpoint="https://DOMAIN/api/oauth/gmail/webhook" \
  --push-auth-service-account="pp-gmail-incoming-invoker@PROJECT_ID.iam.gserviceaccount.com" \
  --push-auth-token-audience="https://DOMAIN/api/oauth/gmail/webhook"
```

Console equivalent: **Create subscription** → Delivery type **Push** → Endpoint = webhook URL → **Enable authentication** → pick the `pp-gmail-incoming-invoker` SA → Audience = webhook URL.

> The endpoint must be publicly reachable over HTTPS. Localhost won't work — for local testing tunnel it (e.g. `ngrok http 4000`) and use the tunnel URL as both the endpoint and the audience.

## 6. Set the two env vars

Add to `packages/api/.env` locally and to the **`API_ENV`** GitHub secret for prod (the whole `.env` content is written verbatim on deploy — see `documentation/DEPLOY.md`). Missing either silently stops bank-alert import: no topic → `startWatch` throws; no audience → the webhook rejects every push.

```
GMAIL_PUBSUB_TOPIC=projects/PROJECT_ID/topics/pp-gmail-incoming
GMAIL_PUBSUB_AUDIENCE=https://YOUR_DOMAIN/api/oauth/gmail/webhook
```

Redeploy (or restart the API) so it picks them up.

## 7. Per-user onboarding (done in the app, not GCP)

Each user brings their **own** OAuth client — there's no shared client id/secret baked into the app. This is Console-only; `gcloud` has no command for creating OAuth clients.

### 7.1 Configure the OAuth consent screen

Console → **APIs & Services → OAuth consent screen** (skip if already configured for this project):

1. User type: **External** (or **Internal** if it's a Google Workspace org and you only need org members).
2. App name, user support email, developer contact email — anything reasonable.
3. Scopes: add `openid`, `.../auth/userinfo.email`, and `.../auth/gmail.readonly` (these are exactly what `buildAuthorizeUrl` in `packages/api/src/utils/google-oauth.util.ts` requests).
4. If the app stays in **Testing** publish status, add your own Google account under **Test users** — otherwise consent will be blocked.

### 7.2 Create the OAuth client ID

Console → **APIs & Services → Credentials → Create Credentials → OAuth client ID**:

1. Application type: **Web application**.
2. Name: anything (e.g. `pocket-pixel-gmail`).
3. **Authorized redirect URIs**: add exactly one URI —

   ```
   https://YOUR_DOMAIN/api/oauth/google/callback
   ```

   This must match `GOOGLE_REDIRECT_URI` (`${APP_BASE_URL}/api/oauth/google/callback`) **byte-for-byte** — trailing slashes or a scheme mismatch (`http` vs `https`) cause Google to reject the callback with `redirect_uri_mismatch`. For local dev use `http://localhost:4000/api/oauth/google/callback`.

4. Click **Create**. Copy the **Client ID** and **Client Secret** shown — the secret isn't retrievable again from Console without regenerating it.

### 7.3 Register the client + connect Gmail

1. In the app, go to **Settings → Google OAuth**, paste the **Client ID** and **Client Secret** from 7.2, and **Save Credentials**. The secret is encrypted at rest (`profileApi.setOAuthCredentials`) and never displayed again.
2. Click **Connect Gmail** — this redirects to Google's consent screen requesting `openid email gmail.readonly`, then back to the webhook callback, which exchanges the code for tokens and stores them.
3. In Gmail, create a **filter** that labels bank alert emails (e.g. from BRAC/EBL senders) with a label like `BankAlerts`.
4. Back in **Bank Alert Watch**, pick a vault, tick that label, and **Start Watching**.

That calls `users.watch` on the chosen label, stores the baseline `historyId`, and the daily renewal cron keeps the watch alive.

## 8. Verify it works

- Send yourself a test bank-style email that lands under the watched label.
- Within seconds Pub/Sub POSTs the webhook; a new transaction should appear.
- API logs show `Started Gmail watch`, then on delivery `Created transaction from Gmail bank alert`.
- If nothing arrives: check the subscription's endpoint + audience match `GMAIL_PUBSUB_AUDIENCE` exactly, the topic has the Gmail publisher binding (step 3), and the endpoint is publicly reachable.
- Gmail watches lapse after ~7 days; the app re-`watch`es daily and on boot, so no manual renewal is needed.
