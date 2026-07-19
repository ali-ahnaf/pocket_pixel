export interface SetOAuthCredentialsInput {
  clientId: string;
  clientSecret: string;
}

/**
 * Status-only response. Never carries the decrypted client id/secret or tokens
 * back to the client — this resource is write-only from the UI's perspective.
 * `configured` = a client id/secret is stored; `connected` = the user has
 * completed the Gmail consent flow and a refresh token is held.
 */
export interface OAuthCredentialsStatusDto {
  configured: boolean;
  connected: boolean;
  googleEmail?: string;
}

/**
 * Response of the authorize endpoint: the Google consent URL the browser should
 * be redirected to, pre-built with the user's own client id and a signed state.
 */
export interface AuthorizeUrlDto {
  url: string;
}
