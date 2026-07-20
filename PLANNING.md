Add automatic transaction detection by parsing bank alert emails (BRAC Bank, EBL etc) received in the user's Gmail, using Gmail API push notifications (Pub/Sub) instead of polling.

Steps to configrue GCP:

- Create a project
- enable pub/sub api https://console.cloud.google.com/apis/enableflow?apiid=pubsub.googleapis.com
- enable gmail api
- create a topic: https://console.cloud.google.com/cloudpubsub/topicList

Steps to implement:

- Token storage: current UserOAuthCredential entity only has client id/secret, no columns for accessToken/refreshToken/tokenExpiry. Need to add those (encrypted, same AES-256-GCM pattern).
- redirect URI should be fixed. implement an endpoint and all users will be redirected there but with their own user id shoe horned in the request somehow.
- Token refresh strategy — refresh on 401
- Implemnet per-user OAuth flow (standard OAuth2 code exchange/refresh, except the client ID/secret used are loaded from that user's own stored row instead of one global app-wide credential). Make sure to send required scopes as per docs (gmail.readonly)

- Use Gmail API push notifications instead of polling. It should return a historyId, store it. Next time, when webhook triggers, check if new historyID arrived. if it does, fetch new emails

Notes

- Use label id to filter the pub/sub so i get notified only when it is relevant.
- when searching via the history poll use labelids of all labels the user attached: GET /gmail/v1/users/me/history
  ?startHistoryId=X&historyTypes=messageAdded&labelId=Label_887...

Reference:

- https://developers.google.com/workspace/gmail/api/auth/web-server
- https://developers.google.com/workspace/gmail/api/guides/push
- https://developers.google.com/workspace/gmail/api/guides/batch (best practices of making bulk requests)
- https://docs.cloud.google.com/pubsub/docs/publish-receive-messages-console

---

# GCP + env setup runbook (human/infra)

The code is fully implemented and tested. What's left is the one-time Google Cloud provisioning plus two env vars. Do this once as the **app owner** (single app-owned topic — every user's Gmail watch publishes to it; the webhook routes each notification to the right user by their connected Gmail address).

Set these placeholders once and reuse them below:

| Placeholder      | Meaning                                            | Example                                                   |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `PROJECT_ID`     | Your GCP project id                                | `pocket-pixel-prod`                                       |
| `PROJECT_NUMBER` | The project's numeric id (Console home / `gcloud`) | `123456789012`                                            |
| `APP_BASE_URL`   | The API's public origin (already in `API_ENV`)     | `https://pocketpixel.example.com`                         |
| Webhook URL      | Always `${APP_BASE_URL}/api/oauth/gmail/webhook`   | `https://pocketpixel.example.com/api/oauth/gmail/webhook` |

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
  --push-endpoint="https://pocketpixel.aliahnaf.fun/api/oauth/gmail/webhook" \
  --push-auth-service-account="pp-gmail-incoming-invoker@PROJECT_ID.iam.gserviceaccount.com" \
  --push-auth-token-audience="https://pocketpixel.aliahnaf.fun/api/oauth/gmail/webhook"
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

Each user, once — the OAuth client + `gmail.readonly` consent flow already exists at **Settings → Google OAuth**:

1. In Gmail, create a **filter** that labels bank alert emails (e.g. from BRAC/EBL senders) with a label like `BankAlerts`.
2. In the app, go to **Settings → Google OAuth**, connect Gmail, then in **Bank Alert Watch** tick that label and **Start Watching**.

That calls `users.watch` on the chosen label, stores the baseline `historyId`, and the daily renewal cron keeps the watch alive.

## 8. Verify it works

- Send yourself a test bank-style email that lands under the watched label.
- Within seconds Pub/Sub POSTs the webhook; a new transaction should appear.
- API logs show `Started Gmail watch`, then on delivery `Created transaction from Gmail bank alert`.
- If nothing arrives: check the subscription's endpoint + audience match `GMAIL_PUBSUB_AUDIENCE` exactly, the topic has the Gmail publisher binding (step 3), and the endpoint is publicly reachable.
- Gmail watches lapse after ~7 days; the app re-`watch`es daily and on boot, so no manual renewal is needed.


# Plugging in watchers for Vaults

From the settings page, in the bank alert watch section, i want to redesign the page.
- show the list of user's existing vaults
- user selects a vault and attaches label listeners per vault (1 label per vault). for example, for vault MAIN STASH, i want to listen for the following label BANK/EBL. 
- Show an input field to enter a custom js script to parse the mail.  the script should export title, amount, date, expense type (income or expense).
- a test button should be available for the user to run the script themselves by entering a sample email in a text area
- remove existing parsers /Users/aliahnaf/Projects/expense_tracker/packages/api/src/parsers/gmail
