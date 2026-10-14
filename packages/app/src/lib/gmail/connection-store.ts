import * as SecureStore from 'expo-secure-store';

/** A user's Gmail link: the connected account and how far `GmailService.sync` has read. */
export interface GmailConnection {
  email: string;
  /** Epoch ms of the last finished sync; null until the first sync sets the baseline. */
  syncedAt: number | null;
  /** True once Google stopped issuing tokens; the home banner asks the user to reconnect. */
  reconnectRequired: boolean;
}

/** What GmailService needs from storage; lets tests swap in an in-memory store. */
export interface GmailConnectionStore {
  get(userId: string): Promise<GmailConnection | null>;
  set(userId: string, connection: GmailConnection): Promise<void>;
}

const itemKey = (userId: string): string => `gmail_connection_${userId}`;

/**
 * Kept in the OS secure store next to the session and AI key, not in SQLite, so the
 * link to a Gmail account stays out of backups and exports of the app database.
 */
export const gmailConnectionStore: GmailConnectionStore = {
  async get(userId) {
    const raw = await SecureStore.getItemAsync(itemKey(userId));
    return raw ? (JSON.parse(raw) as GmailConnection) : null;
  },
  set: (userId, connection) => SecureStore.setItemAsync(itemKey(userId), JSON.stringify(connection)),
};
