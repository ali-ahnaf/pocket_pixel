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
