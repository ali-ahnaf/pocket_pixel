import * as SecureStore from 'expo-secure-store';

const SESSION_ITEM = 'session_user_id';

/** What AuthService needs from storage; lets tests swap in an in-memory store. */
export interface SessionStore {
  get(): Promise<string | null>;
  set(userId: string): Promise<void>;
  clear(): Promise<void>;
}

/** The signed-in user id lives in the OS secure store, so it is not part of the SQLite file that backups and exports copy. */
export const sessionStore: SessionStore = {
  get: () => SecureStore.getItemAsync(SESSION_ITEM),
  set: (userId) => SecureStore.setItemAsync(SESSION_ITEM, userId),
  clear: () => SecureStore.deleteItemAsync(SESSION_ITEM),
};
