import { AppDataSource } from './data-source';
import { User } from '../entities/User.entity';
import { Vault } from '../entities/Vault.entity';
import { recurringService } from '../services';

const LOCAL_USER_NAME = 'Me';
// users.email is NOT NULL UNIQUE, so the single local user needs a placeholder address.
const LOCAL_USER_EMAIL = 'local@pocketpixel.app';

/** Opens the on-device DB (running migrations), makes sure the single local user exists, then catches up recurring transactions. */
export async function initDatabase(): Promise<{ userId: string }> {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();

  // Oldest user, not findByEmail: the email is a placeholder that a later feature (rename, backup import) may change.
  const [existing] = await AppDataSource.getRepository(User).find({ order: { createdAt: 'ASC' }, take: 1 });
  const user =
    existing ??
    // Mirrors sign-up in the API (auth.service.ts) without a password. One transaction, so a crash cannot leave a user without a vault.
    (await AppDataSource.transaction(async (em) => {
      const created = await em.save(em.create(User, { name: LOCAL_USER_NAME, email: LOCAL_USER_EMAIL, avatar: '' }));
      await em.save(em.create(Vault, { userId: created.id, name: 'Main Stash', description: '', isDefault: true }));
      return created;
    }));

  await recurringService.catchUp(user.id);
  return { userId: user.id };
}
