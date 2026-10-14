import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/** What GmailService needs from Google Sign-In; lets tests swap in a fake. */
export interface GoogleAuth {
  /** Interactive sign-in asking for read-only Gmail access. Returns the account email, or null when the user cancels. */
  signIn(): Promise<string | null>;
  /** A current access token, or null when Google needs the user to sign in again (or the Gmail scope was not granted). */
  getAccessToken(): Promise<string | null>;
  /** Drops a token Gmail rejected so the next `getAccessToken` fetches a fresh one. Android caches tokens; iOS refreshes on its own. */
  clearAccessToken(token: string): Promise<void>;
}

let configured = false;

// Configured on first use, not at import: on iOS a missing client id rejects inside configure, and that error
// belongs on the Connect Gmail button, not at app start for users who never touch Gmail.
// No webClientId: the app only needs an access token, not an id token or server auth code.
// Android matches the build to its OAuth client by package name + SHA-1, so it needs no id here.
const ensureConfigured = (): void => {
  if (configured) return;
  GoogleSignin.configure({ scopes: [GMAIL_READONLY_SCOPE], iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
  configured = true;
};

/**
 * Gmail access through the native Google Sign-In SDK. No refresh token ever
 * reaches the app: the SDK keeps the session and hands out short-lived access tokens.
 * ponytail: one Google account per install, shared by every local user. Add per-user accounts if several people sign in on one phone.
 */
export const googleAuth: GoogleAuth = {
  async signIn() {
    ensureConfigured();
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') return null;
    if (!response.data.scopes.includes(GMAIL_READONLY_SCOPE)) throw new Error('Gmail access was not granted. Connect again and allow reading your email.');
    return response.data.user.email;
  },

  async getAccessToken() {
    ensureConfigured();
    const response = await GoogleSignin.signInSilently();
    if (response.type !== 'success' || !response.data.scopes.includes(GMAIL_READONLY_SCOPE)) return null;
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  },

  async clearAccessToken(token) {
    await GoogleSignin.clearCachedAccessToken(token);
  },
};
