export interface SetOAuthCredentialsInput {
  clientId: string;
  clientSecret: string;
}

/**
 * Status-only response. Never carries the decrypted client id/secret back to
 * the client — this resource is write-only from the UI's perspective.
 */
export interface OAuthCredentialsStatusDto {
  configured: boolean;
}
