import * as SecureStore from 'expo-secure-store';

const API_KEY_ITEM = 'openrouter_api_key';
const MODEL_ITEM = 'openrouter_model';

/** What AiService needs from storage; lets tests swap in an in-memory store. */
export interface AiCredentialStore {
  getApiKey(): Promise<string | null>;
  setApiKey(apiKey: string): Promise<void>;
  getModel(): Promise<string | null>;
  setModel(model: string): Promise<void>;
}

/**
 * The OpenRouter key lives in the OS secure store (iOS Keychain / Android Keystore),
 * never in SQLite, so it stays out of backups and exports of the app database.
 * The model id is not secret but sits next to it to avoid a schema migration.
 * ponytail: no delete/clear method, add when the settings screen needs a "remove key" button.
 */
export const aiCredentialStore: AiCredentialStore = {
  getApiKey: () => SecureStore.getItemAsync(API_KEY_ITEM),
  setApiKey: (apiKey) => SecureStore.setItemAsync(API_KEY_ITEM, apiKey),
  getModel: () => SecureStore.getItemAsync(MODEL_ITEM),
  setModel: (model) => SecureStore.setItemAsync(MODEL_ITEM, model),
};
