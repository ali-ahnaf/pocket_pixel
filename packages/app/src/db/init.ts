import { AppDataSource } from './data-source';

/** Opens the on-device DB, running any pending migrations. Users are created by sign-up, not here. */
export async function initDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
}
